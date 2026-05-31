#!/usr/bin/env node
// Converts the uniform inline Prisma mock to the shared factory form:
//   vi.mock('@/server/db', () => ({ prisma: { <BODY> } }));
// becomes
//   vi.mock('@/server/db', async () => {
//     const { createMockPrisma } = await import('@/test/mocks/prisma');
//     return { prisma: createMockPrisma({ <BODY> }) };
//   });
// Unlisted models then auto-stub instead of throwing. Idempotent + brace-safe.
//
// Usage: node scripts/adopt-factory.mjs <file> [--write]
import fs from 'node:fs';

const file = process.argv[2];
const write = process.argv.includes('--write');
let src = fs.readFileSync(file, 'utf8');

if (src.includes('createMockPrisma')) {
  console.log('SKIP (already uses factory):', file);
  process.exit(0);
}

const anchor = "vi.mock('@/server/db', () => ({";
const start = src.indexOf(anchor);
if (start === -1) {
  console.log('SKIP (no uniform mock):', file);
  process.exit(0);
}

// find `prisma:` then its opening brace
const prismaKey = src.indexOf('prisma:', start);
const braceOpen = src.indexOf('{', prismaKey);
// brace-match the prisma object
let depth = 0;
let i = braceOpen;
for (; i < src.length; i++) {
  const c = src[i];
  if (c === '{') depth++;
  else if (c === '}') {
    depth--;
    if (depth === 0) break;
  }
}
const prismaObjEnd = i; // index of the matching '}'
const prismaObj = src.slice(braceOpen, prismaObjEnd + 1); // includes braces

// find the end of the whole vi.mock(...) statement: after prismaObjEnd we expect `}))` then `;`
const tail = src.slice(prismaObjEnd + 1);
const closeMatch = tail.match(/^\s*,?\s*\}\)\)\s*;/);
if (!closeMatch) {
  console.log('SKIP (unexpected mock close):', file);
  process.exit(0);
}
const stmtEnd = prismaObjEnd + 1 + closeMatch[0].length;

const replacement =
  "vi.mock('@/server/db', async () => {\n" +
  "  const { createMockPrisma } = await import('@/test/mocks/prisma');\n" +
  '  return { prisma: createMockPrisma(' +
  prismaObj +
  ') };\n' +
  '});';

const out = src.slice(0, start) + replacement + src.slice(stmtEnd);

if (write) {
  fs.writeFileSync(file, out);
  console.log('WROTE:', file);
} else {
  console.log('--- DRY RUN', file, '---');
  console.log(out.slice(start, start + replacement.length));
}
