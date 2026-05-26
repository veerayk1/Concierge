#!/usr/bin/env node
/**
 * Follow-up to apply-resident-gate.mjs.
 *
 * The original script placed `if (isResident) return ...` right before
 * the LAST top-level `return (` — which means on pages with separate
 * loading/error early-return states, the gate is BELOW them. Result:
 * if the API 403s for a resident, the error EmptyState renders and
 * the gate never fires.
 *
 * Fix: cut the gate block (the `if (isResident) {...}` block ending
 * just before the original main return) and re-insert immediately
 * before the FIRST `if (loading)` or `if (error)` early return.
 *
 * Pure fs — no execSync.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TARGETS = [
  'src/app/(portal)/units/page.tsx',
  'src/app/(portal)/residents/page.tsx',
  'src/app/(portal)/equipment/page.tsx',
  'src/app/(portal)/governance/page.tsx',
];

let patched = 0, skipped = 0;

for (const file of TARGETS) {
  let src = readFileSync(file, 'utf8');

  // Find the gate block: `if (isResident) {` … matching `}` followed by `\n\n  return (`
  const gateStart = src.indexOf('  if (isResident) {');
  if (gateStart === -1) {
    console.warn(`skip (no gate found): ${file}`);
    skipped++;
    continue;
  }

  // Find the closing `}` of the gate. Walk forward from gateStart,
  // tracking brace depth on every `{` / `}` we see in the file.
  let depth = 0;
  let i = gateStart;
  let gateEnd = -1;
  while (i < src.length) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        gateEnd = i + 1; // exclusive
        break;
      }
    }
    i++;
  }
  if (gateEnd === -1) {
    console.warn(`skip (couldn't find gate close brace): ${file}`);
    skipped++;
    continue;
  }

  // Extract gate + trailing newline.
  let afterGate = gateEnd;
  while (src[afterGate] === '\n' || src[afterGate] === ' ') afterGate++;
  // Reset: just take up to and including the brace + one newline.
  const gateBlock = src.slice(gateStart, gateEnd) + '\n';

  // Remove it from current location.
  src = src.slice(0, gateStart) + src.slice(gateEnd + 1); // +1 to swallow the trailing \n

  // Find the first `if (loading)` early return.
  const loadingIdx = src.indexOf('  if (loading)');
  if (loadingIdx === -1) {
    console.warn(`skip (no if (loading) found): ${file}`);
    skipped++;
    continue;
  }

  // Insert gate block + blank line before `if (loading)`.
  src =
    src.slice(0, loadingIdx) +
    gateBlock +
    '\n' +
    src.slice(loadingIdx);

  writeFileSync(file, src, 'utf8');
  patched++;
  console.log(`hoisted gate in ${file}`);
}

console.log(`\nHoisted: ${patched}, Skipped: ${skipped}`);
