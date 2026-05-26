#!/usr/bin/env node
/**
 * V2 of apply-resident-gate.mjs — places the gate ABOVE the first
 * early return (loading/error/empty) so the resident panel shows
 * before the API has a chance to 403 and render an error EmptyState.
 *
 * Insertion sites, in order of preference:
 *   1. Right before `if (loading)` if it exists.
 *   2. Right before the first `if (` at indent level 2 that returns.
 *   3. Right before the last `return (` at indent level 2.
 *
 * Idempotent. Pure fs.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const TARGETS = [
  {
    file: 'src/app/(portal)/shift-log/page.tsx',
    resource: 'The staff shift log',
    title: 'Shift Log',
    audience: 'front desk and security staff',
  },
  {
    file: 'src/app/(portal)/keys/page.tsx',
    resource: 'Keys and FOB inventory',
    title: 'Keys & FOBs',
    audience: 'front desk and security staff',
  },
  {
    file: 'src/app/(portal)/parking/page.tsx',
    resource: 'Parking permits and violations',
    title: 'Parking',
    audience: 'your property manager or security',
  },
  {
    file: 'src/app/(portal)/security/page.tsx',
    resource: 'The security console',
    title: 'Security',
    audience: 'front desk and security staff',
  },
  {
    file: 'src/app/(portal)/amenities/page.tsx',
    resource: 'Amenity management and approvals',
    title: 'Amenities',
    audience: 'your property manager',
  },
  {
    file: 'src/app/(portal)/visitors/page.tsx',
    resource: 'The visitor log',
    title: 'Visitors',
    audience: 'front desk and security staff',
  },
  {
    file: 'src/app/(portal)/packages/page.tsx',
    resource: 'The package intake console',
    title: 'Packages',
    audience: 'front desk staff',
  },
  {
    file: 'src/app/(portal)/maintenance/page.tsx',
    resource: 'Building-wide maintenance triage',
    title: 'Maintenance',
    audience: 'your property manager or superintendent',
  },
];

let patched = 0, skipped = 0;

for (const target of TARGETS) {
  const file = target.file;
  let src = readFileSync(file, 'utf8');

  if (src.includes('useIsResident')) {
    console.log(`skip (already has gate): ${file}`);
    skipped++;
    continue;
  }

  // 1. Imports — after last @/ import.
  const imports = [...src.matchAll(/^import .+ from ['"]@\/[^'"]+['"];?$/gm)];
  if (imports.length === 0) {
    console.warn(`skip (no @/ imports): ${file}`);
    skipped++;
    continue;
  }
  const lastImp = imports[imports.length - 1];
  const impEnd = lastImp.index + lastImp[0].length;
  src =
    src.slice(0, impEnd) +
    "\nimport { useIsResident } from '@/lib/role-mode';" +
    "\nimport { AccessDeniedPanel } from '@/components/ui/access-denied-panel';" +
    src.slice(impEnd);

  // 2. Component body — `const isResident = useIsResident();` at first
  //    line of the component.
  const compRe = /export default function \w+Page\([^)]*\)\s*\{\s*\n/;
  const compMatch = src.match(compRe);
  if (!compMatch) {
    console.warn(`skip (no component entry): ${file}`);
    skipped++;
    continue;
  }
  const bodyStart = compMatch.index + compMatch[0].length;
  src =
    src.slice(0, bodyStart) +
    '  const isResident = useIsResident();\n' +
    src.slice(bodyStart);

  // 3. Build the gate block.
  const gate =
    `  if (isResident) {\n` +
    `    return (\n` +
    `      <PageShell title="${target.title}" description="">\n` +
    `        <AccessDeniedPanel resource="${target.resource}" whoCanSee="${target.audience}" />\n` +
    `      </PageShell>\n` +
    `    );\n` +
    `  }\n\n`;

  // 4. Find the FIRST early return inside this component body. Look
  //    for `\n  if (loading)` first, then `\n  if (` (any), then the
  //    last `\n  return (` fallback.
  const bodyOffset = bodyStart + '  const isResident = useIsResident();\n'.length;
  const tail = src.slice(bodyOffset);

  let insertOffset = -1;
  const loadingMatch = tail.match(/\n  if \(loading\b/);
  if (loadingMatch) {
    insertOffset = bodyOffset + (loadingMatch.index ?? 0) + 1; // +1 to skip the leading \n
  } else {
    // Next-best: any `if (` returning at indent level 2.
    const ifReturnMatches = [
      ...tail.matchAll(/\n  if \([^)]+\) \{\n\s*return \(/g),
    ];
    if (ifReturnMatches.length > 0) {
      const m = ifReturnMatches[0];
      insertOffset = bodyOffset + (m.index ?? 0) + 1;
    } else {
      // Fallback — last `return (` at indent 2.
      const returns = [...tail.matchAll(/\n  return \(/g)];
      if (returns.length === 0) {
        console.warn(`skip (no return found): ${file}`);
        skipped++;
        continue;
      }
      const last = returns[returns.length - 1];
      insertOffset = bodyOffset + (last.index ?? 0) + 1;
    }
  }

  src = src.slice(0, insertOffset) + gate + src.slice(insertOffset);

  writeFileSync(file, src, 'utf8');
  patched++;
  console.log(`patched ${file}`);
}

console.log(`\nPatched: ${patched}, Skipped: ${skipped}`);
