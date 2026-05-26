#!/usr/bin/env node
/**
 * One-shot script to add `enforcePropertyAccess` to every
 * `vi.mock('@/server/middleware/api-guard', () => ({ ... }))` block
 * in the codebase. The real module exports it; tests were written
 * before it was added and now ~2500 individual cases fail because
 * the mock is missing it.
 *
 * Idempotent — skips mocks that already declare enforcePropertyAccess.
 *
 * Walks src/ recursively via fs (no shell exec).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MOCK_NEEDLE = "vi.mock('@/server/middleware/api-guard'";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.git') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (s.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) out.push(p);
  }
  return out;
}

const files = walk('src');

let patched = 0;
let skipped = 0;
let alreadyHad = 0;

const MOCK_START = /vi\.mock\(\s*['"]@\/server\/middleware\/api-guard['"]\s*,\s*\(\)\s*=>\s*\(\s*\{/g;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes(MOCK_NEEDLE)) continue;

  // Walk each mock block and inject the missing key just before its
  // closing brace. We track brace depth from the `({` opener.
  let i = 0;
  let out = '';
  let changed = false;

  while (i < src.length) {
    const remain = src.slice(i);
    MOCK_START.lastIndex = 0;
    const m = MOCK_START.exec(remain);
    if (!m) {
      out += remain;
      break;
    }
    const matchIdx = m.index;
    out += remain.slice(0, matchIdx + m[0].length);
    i += matchIdx + m[0].length;

    // Capture the object body until matching close brace.
    let depth = 1;
    let body = '';
    let braceEnd = -1;
    for (let j = i; j < src.length; j++) {
      const ch = src[j];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          braceEnd = j;
          break;
        }
      }
      body += ch;
    }
    if (braceEnd === -1) {
      out += body;
      break;
    }
    if (body.includes('enforcePropertyAccess')) {
      out += body;
      out += '}';
      i = braceEnd + 1;
      alreadyHad++;
      continue;
    }

    // Detect indent from the first key line of the body.
    const indentMatch = body.match(/\n( +)[a-zA-Z_]/);
    const indent = indentMatch ? indentMatch[1] : '  ';
    const trimmed = body.replace(/[\s,]+$/, '');
    const newBody = `${trimmed},\n${indent}enforcePropertyAccess: vi.fn().mockReturnValue(null),\n`;
    out += newBody;
    out += '}';
    i = braceEnd + 1;
    changed = true;
  }

  if (changed) {
    writeFileSync(file, out, 'utf8');
    patched++;
    console.log(`patched ${file}`);
  } else {
    skipped++;
  }
}

console.log(`\nPatched: ${patched}, Already had: ${alreadyHad}, Skipped (no change): ${skipped}`);
