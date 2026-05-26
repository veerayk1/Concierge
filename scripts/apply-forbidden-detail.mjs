#!/usr/bin/env node
/**
 * Roll out the `forbidden` AccessDeniedPanel pattern to admin detail
 * pages. Three mechanical edits per file:
 *
 *   1. Add `import { AccessDeniedPanel } from '@/components/ui/access-denied-panel';`
 *      after the last `@/components` import (if missing).
 *
 *   2. Add `forbidden,` to the useApi destructure (if missing).
 *      Match the destructure that already has `error,` and `refetch,`.
 *
 *   3. Insert a `if (forbidden) { return <PageShell …><AccessDeniedPanel…/>
 *      </PageShell>; }` block right BEFORE the `if (error)` early return.
 *
 * Idempotent. Pure fs.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const TARGETS = [
  { file: 'src/app/(portal)/units/[id]/page.tsx',
    title: 'Unit', resource: 'This unit record', audience: 'your property manager' },
  { file: 'src/app/(portal)/residents/[id]/page.tsx',
    title: 'Resident', resource: 'Resident profiles', audience: 'your property manager' },
  { file: 'src/app/(portal)/maintenance/[id]/page.tsx',
    title: 'Maintenance', resource: 'This service request', audience: 'your property manager or superintendent' },
  { file: 'src/app/(portal)/purchase-orders/[id]/page.tsx',
    title: 'Purchase Order', resource: 'Purchase orders', audience: 'your property manager or finance' },
  { file: 'src/app/(portal)/inspections/[id]/page.tsx',
    title: 'Inspection', resource: 'Inspection records', audience: 'your property manager or superintendent' },
  { file: 'src/app/(portal)/equipment/[id]/page.tsx',
    title: 'Equipment', resource: 'Building equipment records', audience: 'your property manager or superintendent' },
  { file: 'src/app/(portal)/alterations/[id]/page.tsx',
    title: 'Alteration', resource: 'Alteration project tracking', audience: 'the board and your property manager' },
  { file: 'src/app/(portal)/governance/[id]/page.tsx',
    title: 'Governance', resource: 'Board governance records', audience: 'the board and your property manager' },
  { file: 'src/app/(portal)/visitors/[id]/page.tsx',
    title: 'Visitor', resource: 'Visitor records', audience: 'front desk and security staff' },
  { file: 'src/app/(portal)/keys/[id]/page.tsx',
    title: 'Key', resource: 'Key and FOB records', audience: 'front desk and security staff' },
  { file: 'src/app/(portal)/compliance/[id]/page.tsx',
    title: 'Compliance', resource: 'Compliance records', audience: 'your property manager or admin' },
  { file: 'src/app/(portal)/recurring-tasks/[id]/page.tsx',
    title: 'Recurring Task', resource: 'Recurring maintenance tasks', audience: 'your property manager or superintendent' },
];

let patched = 0, skipped = 0;

for (const t of TARGETS) {
  let src;
  try { src = readFileSync(t.file, 'utf8'); }
  catch { console.warn(`skip (missing): ${t.file}`); skipped++; continue; }

  if (src.includes('AccessDeniedPanel') && src.includes('forbidden')) {
    console.log(`skip (already patched): ${t.file}`);
    skipped++;
    continue;
  }

  // 1. Add AccessDeniedPanel import after last @/components import.
  if (!src.includes('AccessDeniedPanel')) {
    const importMatches = [...src.matchAll(/^import .+ from ['"]@\/components\/[^'"]+['"];?$/gm)];
    if (importMatches.length === 0) {
      console.warn(`skip (no @/components imports): ${t.file}`);
      skipped++;
      continue;
    }
    const last = importMatches[importMatches.length - 1];
    const insertAt = last.index + last[0].length;
    src = src.slice(0, insertAt)
      + "\nimport { AccessDeniedPanel } from '@/components/ui/access-denied-panel';"
      + src.slice(insertAt);
  }

  // 2. Add `forbidden,` to a `error,` destructure inside useApi() call.
  if (!/\bforbidden,?\s*[\n}]/.test(src) && !src.includes('forbidden:')) {
    // Find first useApi destructure pattern that has `error,` and likely
    // also `loading,`.
    const destructureRe = /(\{\s*(?:data:\s*\w+|data),\s*loading,\s*error,\s*)(refetch)/;
    if (destructureRe.test(src)) {
      src = src.replace(destructureRe, '$1forbidden,\n    $2');
    } else {
      console.warn(`skip (no matching useApi destructure): ${t.file}`);
      skipped++;
      continue;
    }
  }

  // 3. Insert `if (forbidden) { return <PageShell …><AccessDeniedPanel…/></PageShell>; }`
  //    right before `if (error)` early return.
  if (!src.includes('if (forbidden)')) {
    // Find `  if (error) {` at indent 2 — the conventional early-return.
    const errIdx = src.indexOf('  if (error) {');
    if (errIdx === -1) {
      console.warn(`skip (no if(error) early return): ${t.file}`);
      skipped++;
      continue;
    }
    // Decide whether to wrap in PageShell. Heuristic: if the existing
    // error block already wraps in <PageShell> (most do), use PageShell;
    // otherwise drop a bare panel (lets the page's own layout wrap).
    const ctx = src.slice(errIdx, errIdx + 400);
    const usePageShell = /import\s*\{[^}]*PageShell[^}]*\}\s*from\s*['"]@\/components\/layout\/page-shell['"]/.test(src);
    const block = usePageShell
      ? `  if (forbidden) {\n` +
        `    return (\n` +
        `      <PageShell title="${t.title}" description="">\n` +
        `        <AccessDeniedPanel resource="${t.resource}" whoCanSee="${t.audience}" />\n` +
        `      </PageShell>\n` +
        `    );\n` +
        `  }\n\n`
      : `  if (forbidden) {\n` +
        `    return (\n` +
        `      <AccessDeniedPanel resource="${t.resource}" whoCanSee="${t.audience}" />\n` +
        `    );\n` +
        `  }\n\n`;
    src = src.slice(0, errIdx) + block + src.slice(errIdx);
  }

  writeFileSync(t.file, src, 'utf8');
  patched++;
  console.log(`patched ${t.file}`);
}

console.log(`\nPatched: ${patched}, Skipped: ${skipped}`);
