/**
 * POST /api/v1/shift-log/handoff/compose
 *
 * Auto-compose a draft shift report from the entries the on-shift
 * guard or concierge has logged during the current shift window.
 * The wizard UI on /shift-log/end-shift hits this endpoint to get
 * a starter draft that the user can review, edit, and then submit
 * via POST /api/v1/shift-log/handoff (which writes the ShiftHandoff
 * row).
 *
 * What the endpoint does:
 *   1. Resolves the current shift window from `shiftType` (morning /
 *      afternoon / night) and today's date.
 *   2. Pulls every shift_log entry created in that window by anyone
 *      at the property (handoff is to the building, not just to the
 *      next shift of the same guard).
 *   3. Counts side-effects: packages logged, visitors signed in,
 *      incidents reported (cross-table joins, all scoped to the
 *      shift window + property).
 *   4. Generates a deterministic, AI-flavoured `aiSummary` string —
 *      capitalized sentences, smart bullets, urgent items at the top.
 *      Cleans common typos along the way.
 *   5. Returns a *draft* (no DB write) so the wizard can render it
 *      and the user can edit before submitting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

type ShiftType = 'morning' | 'afternoon' | 'night';

function currentShiftType(now: Date): ShiftType {
  const h = now.getHours();
  if (h >= 6 && h < 14) return 'morning';
  if (h >= 14 && h < 22) return 'afternoon';
  return 'night';
}

function shiftWindow(shiftType: ShiftType, anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  const end = new Date(anchor);
  if (shiftType === 'morning') {
    start.setHours(6, 0, 0, 0);
    end.setHours(14, 0, 0, 0);
  } else if (shiftType === 'afternoon') {
    start.setHours(14, 0, 0, 0);
    end.setHours(22, 0, 0, 0);
  } else {
    // Night spans midnight. Anchor is the calendar day the shift STARTED on.
    start.setHours(22, 0, 0, 0);
    end.setHours(22, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    // 6am next day end of window.
    end.setHours(6, 0, 0, 0);
  }
  return { start, end };
}

// Very small "AI" cleanup pass — capitalise first letter of sentences,
// trim runs of whitespace, fix the most common typo offenders. Anything
// that genuinely needs an LLM (e.g. paraphrasing for tone) is out of
// scope here; the goal is "looks professional, no glaring typos."
const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  recieved: 'received',
  ocurred: 'occurred',
  reccieved: 'received',
  noticeed: 'noticed',
  toungue: 'tongue',
  resedent: 'resident',
  resedents: 'residents',
  recieving: 'receiving',
  hieght: 'height',
  paitent: 'patient',
  occured: 'occurred',
};

function aiPolish(raw: string): string {
  if (!raw) return '';
  let out = raw.replace(/\s+/g, ' ').trim();
  // typo fix on whole-word matches, case-preserving on the first letter
  out = out.replace(/\b(\w+)\b/g, (m) => {
    const key = m.toLowerCase();
    const fix = COMMON_TYPOS[key];
    if (!fix) return m;
    return m[0] === m[0]?.toUpperCase() ? fix[0]!.toUpperCase() + fix.slice(1) : fix;
  });
  // capitalize first letter of each sentence
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  // ensure trailing period
  if (out && !/[.!?]$/.test(out)) out += '.';
  return out;
}

// Detect important / urgent entries we should bubble up.
function isUrgent(priority?: string | null, content?: string | null) {
  if (priority === 'urgent') return true;
  if (priority === 'important') return true;
  if (!content) return false;
  return /\b(urgent|emergency|alarm|police|fire|injury|leak|flood|intrusion|tow)\b/i.test(content);
}

interface ComposeRequest {
  propertyId: string;
  shiftType?: ShiftType;
  shiftDate?: string; // YYYY-MM-DD
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_guard',
        'security_supervisor',
        'superintendent',
        'front_desk',
      ],
    });
    if (auth.error) return auth.error;

    const body = (await request.json().catch(() => ({}))) as ComposeRequest;
    const { propertyId } = body;
    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required.' },
        { status: 400 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    const now = new Date();
    const shiftType: ShiftType = body.shiftType ?? currentShiftType(now);
    const anchor = body.shiftDate ? new Date(body.shiftDate) : now;
    const { start, end } = shiftWindow(shiftType, anchor);

    // -------------------------------------------------------------------
    // Pull shift_log entries created in the window.
    // -------------------------------------------------------------------
    const entries = await prisma.event.findMany({
      where: {
        propertyId,
        deletedAt: null,
        eventType: { slug: { in: ['shift-log', 'shift_log'] } },
        createdAt: { gte: start, lt: end },
      },
      include: {
        eventType: { select: { name: true } },
        unit: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // -------------------------------------------------------------------
    // Side-effect counts: packages, visitors, incidents in the window.
    // -------------------------------------------------------------------
    const [packagesCount, visitorsCount, incidentsCount] = await Promise.all([
      prisma.package.count({
        where: { propertyId, deletedAt: null, createdAt: { gte: start, lt: end } },
      }),
      prisma.visitorEntry.count({
        where: { propertyId, arrivalAt: { gte: start, lt: end } },
      }),
      prisma.event.count({
        where: {
          propertyId,
          deletedAt: null,
          eventType: { slug: { in: ['incident-report', 'incident_report'] } },
          createdAt: { gte: start, lt: end },
        },
      }),
    ]).catch(() => [0, 0, 0]);

    // -------------------------------------------------------------------
    // Bucket entries by urgency. Urgent items get lifted to the top of
    // the auto-summary so the next shift sees them first.
    // -------------------------------------------------------------------
    const urgent = entries.filter((e) => isUrgent(e.priority, e.description ?? e.title ?? ''));
    const routine = entries.filter((e) => !isUrgent(e.priority, e.description ?? e.title ?? ''));

    // Build flaggedItems[] for the ShiftHandoff row.
    const flaggedItems = urgent.map((e) => ({
      id: e.id,
      description: aiPolish(e.description ?? e.title ?? ''),
      priority: e.priority ?? 'important',
      unit_number: e.unit?.number ?? null,
      event_id: e.id,
    }));

    // -------------------------------------------------------------------
    // Generate aiSummary — concise narrative of the shift.
    // -------------------------------------------------------------------
    const lines: string[] = [];
    const countParts: string[] = [];
    if (packagesCount > 0)
      countParts.push(`${packagesCount} package${packagesCount === 1 ? '' : 's'} logged`);
    if (visitorsCount > 0)
      countParts.push(`${visitorsCount} visitor${visitorsCount === 1 ? '' : 's'} signed in`);
    if (incidentsCount > 0)
      countParts.push(`${incidentsCount} incident${incidentsCount === 1 ? '' : 's'} reported`);

    const shiftLabel =
      shiftType === 'morning' ? 'morning' : shiftType === 'afternoon' ? 'afternoon' : 'overnight';

    if (countParts.length > 0) {
      lines.push(`Quiet but busy ${shiftLabel}: ${countParts.join(', ')}.`);
    } else if (entries.length === 0) {
      lines.push(`Quiet ${shiftLabel} — nothing logged.`);
    } else {
      lines.push(
        `${shiftLabel.charAt(0).toUpperCase() + shiftLabel.slice(1)} shift logged ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}.`,
      );
    }

    if (urgent.length > 0) {
      lines.push(
        `${urgent.length} item${urgent.length === 1 ? '' : 's'} flagged for the next shift to follow up.`,
      );
    }
    if (routine.length > 0 && urgent.length > 0) {
      lines.push(`${routine.length} routine note${routine.length === 1 ? '' : 's'} otherwise.`);
    }
    const aiSummary = lines.map(aiPolish).join(' ');

    // -------------------------------------------------------------------
    // Notes — pre-fill with a bulleted list of every entry so the
    // wizard renders something the user can trim. The user edits this
    // in the dialog before submitting.
    // -------------------------------------------------------------------
    const notesLines: string[] = [];
    if (urgent.length > 0) {
      notesLines.push('PASS-ON:');
      for (const e of urgent) {
        const text = aiPolish(e.description ?? e.title ?? '');
        const unitPart = e.unit?.number ? ` [Unit ${e.unit.number}]` : '';
        notesLines.push(`• ${text}${unitPart}`);
      }
      notesLines.push('');
    }
    if (routine.length > 0) {
      notesLines.push('ROUTINE:');
      for (const e of routine) {
        const text = aiPolish(e.description ?? e.title ?? '');
        const unitPart = e.unit?.number ? ` [Unit ${e.unit.number}]` : '';
        notesLines.push(`• ${text}${unitPart}`);
      }
    }
    const notes = notesLines.join('\n');

    return NextResponse.json({
      data: {
        shiftType,
        shiftDate: anchor.toISOString().slice(0, 10),
        shiftWindow: { start: start.toISOString(), end: end.toISOString() },
        counts: {
          entries: entries.length,
          urgent: urgent.length,
          routine: routine.length,
          packagesLogged: packagesCount,
          visitorsSignedIn: visitorsCount,
          incidentsReported: incidentsCount,
        },
        aiSummary,
        notes,
        flaggedItems,
        // Echo back the raw entries so the wizard can list them as
        // optional include/exclude checkboxes.
        entries: entries.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          priority: e.priority,
          createdAt: e.createdAt,
          unit: e.unit ? { id: e.unit.id, number: e.unit.number } : null,
          isUrgent: isUrgent(e.priority, e.description ?? e.title ?? ''),
        })),
      },
    });
  } catch (error) {
    console.error('POST /api/v1/shift-log/handoff/compose error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to compose shift report.',
      },
      { status: 500 },
    );
  }
}
