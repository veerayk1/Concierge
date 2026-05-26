#!/usr/bin/env node
/**
 * One-shot script: add a useIsResident gate + AccessDeniedPanel to a
 * list of admin-only portal pages so residents who URL-hit them see
 * the friendly "Not available for your role" panel instead of the
 * admin chrome + an Insufficient permissions error.
 *
 * Idempotent — skips pages that already import useIsResident.
 *
 * For each page in TARGETS:
 *   1. Insert the two imports after the LAST '@/components' or
 *      '@/lib' import line.
 *   2. Insert `const isResident = useIsResident();` as the FIRST
 *      line inside `export default function XxxPage() {`.
 *   3. Insert the gate block right before the LAST top-level
 *      `return (` (the main render — earlier returns are loading /
 *      error states and don't need gating).
 */

import { readFileSync, writeFileSync } from 'node:fs';

const TARGETS = [
  {
    file: 'src/app/(portal)/units/page.tsx',
    resource: 'Unit management',
    title: 'Units',
    audience: 'your property manager',
  },
  {
    file: 'src/app/(portal)/residents/page.tsx',
    resource: 'The resident directory',
    title: 'Residents',
    audience: 'your property manager',
  },
  {
    file: 'src/app/(portal)/alterations/page.tsx',
    resource: 'Alteration project tracking',
    title: 'Alterations',
    audience: 'the board and your property manager',
  },
  {
    file: 'src/app/(portal)/purchase-orders/page.tsx',
    resource: 'Purchase orders',
    title: 'Purchase Orders',
    audience: 'your property manager or finance',
  },
  {
    file: 'src/app/(portal)/equipment/page.tsx',
    resource: 'Building equipment records',
    title: 'Equipment',
    audience: 'your property manager or superintendent',
  },
  {
    file: 'src/app/(portal)/inspections/page.tsx',
    resource: 'Inspection records',
    title: 'Inspections',
    audience: 'your property manager or superintendent',
  },
  {
    file: 'src/app/(portal)/recurring-tasks/page.tsx',
    resource: 'Recurring maintenance tasks',
    title: 'Recurring Tasks',
    audience: 'your property manager or superintendent',
  },
  {
    file: 'src/app/(portal)/governance/page.tsx',
    resource: 'Board governance — meetings, minutes, resolutions',
    title: 'Governance',
    audience: 'the board and your property manager',
  },
  {
    file: 'src/app/(portal)/compliance/page.tsx',
    resource: 'Compliance reports and audit',
    title: 'Compliance',
    audience: 'your property manager or admin',
  },
];

let patched = 0;
let skipped = 0;

for (const target of TARGETS) {
  const file = target.file;
  let src = readFileSync(file, 'utf8');

  if (src.includes('useIsResident')) {
    console.log(`skip (already has gate): ${file}`);
    skipped++;
    continue;
  }

  // 1. Insert imports — find the last '@/' import and append after it.
  const importLines = [...src.matchAll(/^import .+ from ['"]@\/[^'"]+['"];?$/gm)];
  if (importLines.length === 0) {
    console.warn(`skip (no @/ imports found): ${file}`);
    skipped++;
    continue;
  }
  const lastImport = importLines[importLines.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;
  src =
    src.slice(0, insertAt) +
    "\nimport { useIsResident } from '@/lib/role-mode';" +
    "\nimport { AccessDeniedPanel } from '@/components/ui/access-denied-panel';" +
    src.slice(insertAt);

  // 2. Insert `const isResident = useIsResident();` as first line of the
  //    component body. Find `export default function XxxPage()` and the
  //    opening brace's next newline.
  const componentMatch = src.match(/export default function \w+Page\([^)]*\)\s*\{\s*\n/);
  if (!componentMatch) {
    console.warn(`skip (couldn't find component entry): ${file}`);
    skipped++;
    continue;
  }
  const bodyStart = componentMatch.index + componentMatch[0].length;
  src =
    src.slice(0, bodyStart) +
    '  const isResident = useIsResident();\n' +
    src.slice(bodyStart);

  // 3. Insert the gate before the LAST top-level `return (` — i.e. the
  //    return statement at indentation level 2 (two spaces) followed by
  //    `(`. Walk all matches, take the last.
  const returnPattern = /\n  return \(/g;
  const returns = [...src.matchAll(returnPattern)];
  if (returns.length === 0) {
    console.warn(`skip (couldn't find main return): ${file}`);
    skipped++;
    continue;
  }
  const mainReturn = returns[returns.length - 1];
  const gate =
    `\n  if (isResident) {\n` +
    `    return (\n` +
    `      <PageShell title="${target.title}" description="">\n` +
    `        <AccessDeniedPanel resource="${target.resource}" whoCanSee="${target.audience}" />\n` +
    `      </PageShell>\n` +
    `    );\n` +
    `  }\n`;
  src = src.slice(0, mainReturn.index) + gate + src.slice(mainReturn.index);

  writeFileSync(file, src, 'utf8');
  patched++;
  console.log(`patched ${file}`);
}

console.log(`\nPatched: ${patched}, Skipped: ${skipped}`);
