/**
 * POST /api/v1/maintenance/triage
 *
 * Deterministic AI-flavoured triage for resident-submitted maintenance
 * requests. The resident types a free-form description; we return:
 *
 *   - suggestedCategory: one of the property's maintenance categories,
 *     matched by keyword (plumbing for "leak/water/pipe", hvac for
 *     "heat/AC/cold/hot", etc.). Falls back to "General".
 *   - suggestedPriority: 'urgent' for emergency language ("flood",
 *     "no heat", "burst", "sparking", "smoke"), 'high' for severe
 *     ("broken", "not working", "completely"), otherwise 'medium'.
 *   - suggestedTitle: short, sentence-cased extract from the first
 *     ~60 chars, with common typos fixed.
 *   - duplicates: any OPEN request on the same unit whose description
 *     overlaps the new one by ≥3 significant keywords (helps a
 *     forgetful resident avoid filing the same thing twice).
 *
 * Pure rule-based — no LLM call — so it's fast (<50ms), deterministic,
 * doesn't burn API quota, and works offline. The wins from a real LLM
 * (paraphrasing for tone, multi-language) are out of scope here; the
 * goal is "stop the resident from misfiling their request."
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Keyword → category routing
// ---------------------------------------------------------------------------

interface CategoryRule {
  /** Match against `name.toLowerCase().includes(...)` when picking the
   *  property's own category. */
  matchName: string[];
  /** Keywords in the description that trigger this category. */
  keywords: RegExp;
}

const CATEGORY_RULES: Record<string, CategoryRule> = {
  plumbing: {
    matchName: ['plumb', 'water'],
    keywords:
      /\b(leak|leaking|water|flood|flooding|pipe|drip|dripping|sink|toilet|faucet|shower|tub|drain|clog|clogged|sewer|wet|pool|pooling)\b/i,
  },
  electrical: {
    matchName: ['electric'],
    keywords:
      /\b(outlet|breaker|fuse|power|electric|electrical|light|lights|bulb|switch|spark|sparking|short|circuit|wire|wiring|blackout|tripping)\b/i,
  },
  hvac: {
    matchName: ['hvac', 'heat', 'cool', 'climate'],
    keywords:
      /\b(hvac|heat|heater|heating|furnace|cold|hot|temperature|thermostat|ac|a\/c|air condition|air-condition|cooling|warm|chilly|freezing|boiler|radiator|vent|venting|airflow)\b/i,
  },
  appliance: {
    matchName: ['appliance'],
    keywords:
      /\b(stove|oven|range|fridge|refrigerator|dishwasher|microwave|washer|dryer|laundry|appliance|disposal|garbage disposal)\b/i,
  },
  carpentry: {
    matchName: ['carpentry', 'door', 'window', 'general'],
    keywords: /\b(door|window|cabinet|drawer|handle|hinge|lock|knob|broken glass|frame)\b/i,
  },
  pest: {
    matchName: ['pest', 'extermination'],
    keywords:
      /\b(rat|rats|mice|mouse|roach|cockroach|cockroaches|ant|ants|bug|bugs|pest|pests|infestation|bed bug|termite)\b/i,
  },
};

// Emergency / urgent language — wins regardless of category.
const URGENT_PATTERNS: RegExp[] = [
  /\b(flood|flooding|burst|sparking|smoke|smoking|fire|gas leak|no heat|no hot water|no power|electric shock|shocked|emergency|urgent|asap|immediately|dangerous)\b/i,
];

// High-priority language.
const HIGH_PATTERNS: RegExp[] = [
  /\b(broken|not working|won't work|wont work|stopped working|completely|nothing|won't|severe|serious|leaking badly|major)\b/i,
];

// Typo fixes — same dictionary as the shift report polish.
const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  recieved: 'received',
  ocurred: 'occurred',
  noticeed: 'noticed',
  resedent: 'resident',
  recieving: 'receiving',
  occured: 'occurred',
  toilett: 'toilet',
  wattr: 'water',
  wter: 'water',
  bathrom: 'bathroom',
  kitchin: 'kitchen',
  recive: 'receive',
};

function aiPolish(s: string): string {
  if (!s) return '';
  let out = s.replace(/\s+/g, ' ').trim();
  out = out.replace(/\b(\w+)\b/g, (m) => {
    const fix = COMMON_TYPOS[m.toLowerCase()];
    if (!fix) return m;
    return m[0] === m[0]?.toUpperCase() ? fix[0]!.toUpperCase() + fix.slice(1) : fix;
  });
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  return out;
}

function deriveTitle(raw: string): string {
  const polished = aiPolish(raw);
  // First sentence, capped at ~60 chars.
  const firstSentence = polished.split(/[.!?]/)[0]?.trim() || polished;
  if (firstSentence.length <= 60) return firstSentence;
  // Cut at last word boundary before 60.
  const cut = firstSentence.slice(0, 60);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function suggestPriority(desc: string): 'low' | 'medium' | 'high' | 'urgent' {
  if (URGENT_PATTERNS.some((p) => p.test(desc))) return 'urgent';
  if (HIGH_PATTERNS.some((p) => p.test(desc))) return 'high';
  return 'medium';
}

function suggestCategoryKey(desc: string): keyof typeof CATEGORY_RULES | null {
  for (const [key, rule] of Object.entries(CATEGORY_RULES)) {
    if (rule.keywords.test(desc)) return key as keyof typeof CATEGORY_RULES;
  }
  return null;
}

// Significant words for duplicate detection — strip stopwords + short
// tokens so "the AC is leaking" doesn't false-match "the door is stuck".
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'to',
  'of',
  'for',
  'in',
  'on',
  'at',
  'by',
  'with',
  'from',
  'as',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'i',
  'my',
  'me',
  'we',
  'our',
  'us',
  'you',
  'your',
  'they',
  'them',
  'their',
  'and',
  'but',
  'or',
  'so',
  'if',
  'then',
  'else',
  'not',
  'no',
  'yes',
  'do',
  'does',
  'did',
  'has',
  'have',
  'had',
  'having',
  'will',
  'would',
  'can',
  'could',
  'should',
  'may',
  'might',
  'must',
  'very',
  'really',
  'just',
  'still',
  'too',
  'also',
  'about',
  'out',
  'over',
  'under',
  'up',
  'down',
  'off',
  'again',
  'now',
  'here',
  'there',
  'than',
]);

function significantTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !STOPWORDS.has(t)),
  );
}

interface TriageRequest {
  propertyId: string;
  unitId?: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = (await request.json().catch(() => ({}))) as TriageRequest;
    const { propertyId, unitId, description } = body;
    if (!propertyId || !description || description.trim().length < 5) {
      return NextResponse.json(
        {
          error: 'VALIDATION',
          message: 'propertyId and a description of 5+ characters are required.',
        },
        { status: 400 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    // ----------------------------------------------------------------
    // 1. Pick a category from the property's own list. Fall back to
    //    "General / Other" if no keyword matches.
    // ----------------------------------------------------------------
    const categories = await prisma.maintenanceCategory.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, name: true, defaultPriority: true },
      orderBy: { sortOrder: 'asc' },
    });

    const matchedKey = suggestCategoryKey(description);
    let suggestedCategory: { id: string; name: string } | null = null;
    if (matchedKey) {
      const rule = CATEGORY_RULES[matchedKey]!;
      suggestedCategory =
        categories.find((c) =>
          rule.matchName.some((needle) => c.name.toLowerCase().includes(needle)),
        ) ?? null;
    }
    if (!suggestedCategory) {
      suggestedCategory =
        categories.find((c) => /general|other/i.test(c.name)) ?? categories[0] ?? null;
    }

    // ----------------------------------------------------------------
    // 2. Priority — keyword-driven, with a category default fallback.
    // ----------------------------------------------------------------
    const priorityFromDesc = suggestPriority(description);
    // Categories store priorities in the maintenance enum ('low' | 'normal'
    // | 'high' | 'critical'); the resident form uses ('low' | 'medium' |
    // 'high' | 'urgent'). Normalize both directions here so the caller
    // gets a single consistent palette.
    function normalize(p: string | null | undefined): 'low' | 'medium' | 'high' | 'urgent' {
      if (p === 'critical') return 'urgent';
      if (p === 'normal') return 'medium';
      if (p === 'low' || p === 'medium' || p === 'high' || p === 'urgent') return p;
      return 'medium';
    }
    const suggestedPriority: 'low' | 'medium' | 'high' | 'urgent' =
      priorityFromDesc !== 'medium'
        ? priorityFromDesc
        : normalize(
            suggestedCategory
              ? categories.find((c) => c.id === suggestedCategory!.id)?.defaultPriority
              : undefined,
          );

    // ----------------------------------------------------------------
    // 3. Title — sentence-cased, typo-fixed extract.
    // ----------------------------------------------------------------
    const suggestedTitle = deriveTitle(description);

    // ----------------------------------------------------------------
    // 4. Duplicates — only on the same unit, open requests, ≥3
    //    significant-word overlap.
    // ----------------------------------------------------------------
    let duplicates: { id: string; title: string; status: string; createdAt: string }[] = [];
    if (unitId) {
      const newTokens = significantTokens(description);
      const candidates = await prisma.maintenanceRequest.findMany({
        where: {
          propertyId,
          unitId,
          deletedAt: null,
          status: { in: ['open', 'in_progress', 'on_hold'] },
        },
        select: { id: true, title: true, description: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      duplicates = candidates
        .map((c) => {
          const haystack = `${c.title} ${c.description ?? ''}`;
          const overlap = [...newTokens].filter((t) => significantTokens(haystack).has(t)).length;
          return { c, overlap };
        })
        .filter(({ overlap }) => overlap >= 3)
        .slice(0, 3)
        .map(({ c }) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
        }));
    }

    return NextResponse.json({
      data: {
        suggestedCategoryId: suggestedCategory?.id ?? null,
        suggestedCategoryName: suggestedCategory?.name ?? null,
        suggestedCategoryKey: matchedKey ?? null,
        suggestedPriority,
        suggestedTitle,
        duplicates,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/maintenance/triage error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to triage request.' },
      { status: 500 },
    );
  }
}
