/**
 * POST /api/v1/ai/polish
 *
 * Deterministic typo + sentence-case cleanup, exposed as a tiny
 * endpoint so any client can offload the cleanup pass without
 * re-implementing the dictionary. Same logic as the shift-handoff
 * compose's aiPolish() so the output is consistent across surfaces.
 */

import { NextRequest, NextResponse } from 'next/server';

import { guardRoute } from '@/server/middleware/api-guard';

const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  recieved: 'received',
  recieving: 'receiving',
  ocurred: 'occurred',
  occured: 'occurred',
  noticeed: 'noticed',
  resedent: 'resident',
  resedents: 'residents',
  toilett: 'toilet',
  wattr: 'water',
  bathrom: 'bathroom',
  kitchin: 'kitchen',
  kicthen: 'kitchen',
  bedrom: 'bedroom',
  livingrom: 'living room',
  hallwy: 'hallway',
  basment: 'basement',
  basemnt: 'basement',
  enterance: 'entrance',
  parkign: 'parking',
  serivce: 'service',
  serivces: 'services',
  conierge: 'concierge',
  conceirge: 'concierge',
  recive: 'receive',
  paitent: 'patient',
  hieght: 'height',
  toungue: 'tongue',
  becuase: 'because',
  becasue: 'because',
  alot: 'a lot',
  alright: 'all right',
  finaly: 'finally',
  recomend: 'recommend',
  occassion: 'occasion',
  occassionally: 'occasionally',
  seperate: 'separate',
  seperately: 'separately',
  thier: 'their',
  recieve: 'receive',
  beleive: 'believe',
  acheive: 'achieve',
  definately: 'definitely',
};

function polish(raw: string): string {
  if (!raw) return '';
  let out = raw.replace(/[ \t]+/g, ' ').trim();
  // Per-word typo fix, case-preserved on first letter.
  out = out.replace(/\b(\w+)\b/g, (m) => {
    const fix = COMMON_TYPOS[m.toLowerCase()];
    if (!fix) return m;
    return m[0] === m[0]?.toUpperCase() ? fix[0]!.toUpperCase() + fix.slice(1) : fix;
  });
  // Capitalize the first letter of each sentence.
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  // Ensure trailing period on lines that don't already end with punctuation.
  out = out
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (/[.!?:]$/.test(t)) return line;
      return line.replace(/\s*$/, '.');
    })
    .join('\n');
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;
    const body = (await request.json().catch(() => ({}))) as { text?: string };
    const text = body.text;
    if (typeof text !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION', message: 'text is required' },
        { status: 400 },
      );
    }
    return NextResponse.json({ data: { polished: polish(text) } });
  } catch (error) {
    console.error('POST /api/v1/ai/polish error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Polish failed.' },
      { status: 500 },
    );
  }
}
