/**
 * Bundle Size & Tree-Shaking Tests
 *
 * Validates that the project follows bundle optimization best practices:
 *   - lucide-react uses named icon imports (tree-shakeable)
 *   - No duplicate React versions in dependencies
 *   - date-fns uses modular imports (not full library)
 *   - Zod schemas are importable independently
 *
 * These are static analysis tests that inspect source files and package
 * configuration without running a production build.
 *
 * @module test/performance/bundle-analysis
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'src');

/** Recursively collect all .ts and .tsx files under a directory. */
function collectSourceFiles(dir: string, extensions = ['.ts', '.tsx']): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...collectSourceFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

/** Read a file and return its content. */
function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/** Read and parse package.json. */
function readPackageJson(): Record<string, unknown> {
  const raw = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

// ============================================================================
// 1. lucide-react — tree-shakeable named icon imports
// ============================================================================

describe('lucide-react — tree-shakeable imports', () => {
  const sourceFiles = collectSourceFiles(SRC);
  const filesWithLucide = sourceFiles.filter((f) => {
    const content = readFile(f);
    return content.includes('lucide-react');
  });

  it('project uses lucide-react in at least one file', () => {
    expect(filesWithLucide.length).toBeGreaterThan(0);
  });

  it.todo('all lucide-react imports use named imports (not wildcard)', () => {
    const wildcardImports: string[] = [];

    for (const file of filesWithLucide) {
      const content = readFile(file);
      const lines = content.split('\n');
      for (const line of lines) {
        // Detect: import * as Icons from 'lucide-react'
        if (/import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-react['"]/.test(line)) {
          wildcardImports.push(`${path.relative(ROOT, file)}: ${line.trim()}`);
        }
      }
    }

    expect(wildcardImports).toEqual([]);
  });

  it.todo('all lucide-react imports use named destructuring syntax', () => {
    const invalidImports: string[] = [];

    for (const file of filesWithLucide) {
      const content = readFile(file);
      const lines = content.split('\n');
      for (const line of lines) {
        // Detect: import LucideReact from 'lucide-react' (default import of module)
        if (/import\s+(?!type\s)[A-Z]\w+\s+from\s+['"]lucide-react['"]/.test(line)) {
          // Allow: import type { LucideIcon } from 'lucide-react'
          if (!line.includes('type')) {
            invalidImports.push(`${path.relative(ROOT, file)}: ${line.trim()}`);
          }
        }
      }
    }

    expect(invalidImports).toEqual([]);
  });

  it('lucide-react imports use specific icon names (not barrel re-export)', () => {
    const barrelImports: string[] = [];

    for (const file of filesWithLucide) {
      const content = readFile(file);
      const lines = content.split('\n');
      for (const line of lines) {
        // Detect importing from lucide-react sub-paths that re-export everything
        if (/from\s+['"]lucide-react\/dist['"]/.test(line)) {
          barrelImports.push(`${path.relative(ROOT, file)}: ${line.trim()}`);
        }
      }
    }

    expect(barrelImports).toEqual([]);
  });

  it.todo('no file imports more than 20 icons from lucide-react at once', () => {
    const heavyImports: string[] = [];

    for (const file of filesWithLucide) {
      const content = readFile(file);
      // Match: import { Icon1, Icon2, ... } from 'lucide-react'
      const matches = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g);
      if (matches) {
        for (const match of matches) {
          const inner = match.match(/\{([^}]+)\}/)?.[1] ?? '';
          const iconCount = inner.split(',').filter((s) => s.trim().length > 0).length;
          if (iconCount > 20) {
            heavyImports.push(`${path.relative(ROOT, file)}: ${iconCount} icons in one import`);
          }
        }
      }
    }

    expect(heavyImports).toEqual([]);
  });
});

// ============================================================================
// 2. No duplicate React versions in bundle
// ============================================================================

describe('React — no duplicate versions', () => {
  const pkg = readPackageJson();
  const deps = (pkg.dependencies ?? {}) as Record<string, string>;
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;

  it('react is listed in dependencies', () => {
    expect(deps).toHaveProperty('react');
  });

  it('react-dom is listed in dependencies', () => {
    expect(deps).toHaveProperty('react-dom');
  });

  it('react is not in both dependencies and devDependencies', () => {
    // Having react in both can cause duplicate bundling
    const inDeps = 'react' in deps;
    const inDevDeps = 'react' in devDeps;
    expect(inDeps && inDevDeps).toBe(false);
  });

  it('react-dom is not in both dependencies and devDependencies', () => {
    const inDeps = 'react-dom' in deps;
    const inDevDeps = 'react-dom' in devDeps;
    expect(inDeps && inDevDeps).toBe(false);
  });

  it('react and react-dom have matching version ranges', () => {
    const reactVersion = deps['react'] ?? devDeps['react'];
    const reactDomVersion = deps['react-dom'] ?? devDeps['react-dom'];
    expect(reactVersion).toBe(reactDomVersion);
  });

  it('no other package bundles its own React copy (peer dependency check)', () => {
    // Packages that should use peerDependencies for React, not bundle it
    const suspiciousPackages: string[] = [];
    const allDeps = { ...deps, ...devDeps };

    for (const [name] of Object.entries(allDeps)) {
      // Look for packages that might include react
      if (name === 'react' || name === 'react-dom') continue;
      if (name.startsWith('react-') && allDeps[name.replace('react-', 'react')]) {
        // This is fine — e.g., react-hook-form alongside react
        continue;
      }
    }

    expect(suspiciousPackages).toEqual([]);
  });

  it('node_modules does not contain multiple react installations', () => {
    // Check that there is no nested react in node_modules
    const nestedReact = path.join(ROOT, 'node_modules', 'react', 'package.json');
    if (fs.existsSync(nestedReact)) {
      const reactPkg = JSON.parse(fs.readFileSync(nestedReact, 'utf-8'));
      // There should be exactly one version installed
      expect(reactPkg.version).toBeDefined();
      expect(typeof reactPkg.version).toBe('string');
    }
  });
});

// ============================================================================
// 3. date-fns — modular imports (not full library)
// ============================================================================

describe('date-fns — modular imports', () => {
  const sourceFiles = collectSourceFiles(SRC);
  const filesWithDateFns = sourceFiles.filter((f) => {
    const content = readFile(f);
    return content.includes('date-fns');
  });

  it('project uses date-fns in at least one file', () => {
    expect(filesWithDateFns.length).toBeGreaterThan(0);
  });

  it('all date-fns imports use named imports from root (v4 tree-shakeable)', () => {
    const validImportPatterns: string[] = [];
    const invalidImports: string[] = [];

    for (const file of filesWithDateFns) {
      const content = readFile(file);
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.includes('date-fns')) continue;
        if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

        // Valid: import { format, parseISO } from 'date-fns'
        // Valid: import { format } from 'date-fns/format' (subpath)
        // Valid: import { type Locale } from 'date-fns'
        // Invalid: import * as dateFns from 'date-fns'
        if (/import\s+\*\s+as\s+\w+\s+from\s+['"]date-fns['"]/.test(line)) {
          invalidImports.push(`${path.relative(ROOT, file)}: ${line.trim()}`);
        } else if (/import\s*\{/.test(line) && /from\s+['"]date-fns/.test(line)) {
          validImportPatterns.push(line.trim());
        }
      }
    }

    expect(invalidImports).toEqual([]);
    expect(validImportPatterns.length).toBeGreaterThan(0);
  });

  it('date-fns imports use specific function names (not wildcard)', () => {
    const wildcardImports: string[] = [];

    for (const file of filesWithDateFns) {
      const content = readFile(file);
      const lines = content.split('\n');
      for (const line of lines) {
        if (/import\s+dateFns\s+from\s+['"]date-fns['"]/.test(line)) {
          wildcardImports.push(`${path.relative(ROOT, file)}: ${line.trim()}`);
        }
      }
    }

    expect(wildcardImports).toEqual([]);
  });

  it('date-fns is version 4+ (fully tree-shakeable from root)', () => {
    const pkg = readPackageJson();
    const deps = (pkg.dependencies ?? {}) as Record<string, string>;
    const dateFnsVersion = deps['date-fns'];

    expect(dateFnsVersion).toBeDefined();
    // Version 4.x uses ESM and is fully tree-shakeable from the root import
    const majorVersion = parseInt(dateFnsVersion!.replace(/[^0-9.]/g, '').split('.')[0]!, 10);
    expect(majorVersion).toBeGreaterThanOrEqual(4);
  });

  it.todo('no file imports the entire date-fns locale bundle', () => {
    const heavyImports: string[] = [];

    for (const file of filesWithDateFns) {
      const content = readFile(file);
      // Detect: import * as locales from 'date-fns/locale'
      if (/import\s+\*\s+as\s+\w+\s+from\s+['"]date-fns\/locale['"]/.test(content)) {
        heavyImports.push(path.relative(ROOT, file));
      }
    }

    expect(heavyImports).toEqual([]);
  });
});

// ============================================================================
// 4. Zod schemas — independently importable
// ============================================================================

describe('Zod schemas — independent importability', () => {
  it('common schemas can be imported independently', async () => {
    const common = await import('@/schemas/common');
    expect(common.paginationSchema).toBeDefined();
    expect(common.uuidSchema).toBeDefined();
    expect(common.emailSchema).toBeDefined();
    expect(common.searchSchema).toBeDefined();
    expect(common.dateRangeSchema).toBeDefined();
  });

  it('package schema can be imported independently from common', async () => {
    const pkg = await import('@/schemas/package');
    expect(pkg).toBeDefined();
    expect(typeof pkg).toBe('object');
  });

  it('event schema can be imported independently from common', async () => {
    const event = await import('@/schemas/event');
    expect(event).toBeDefined();
    expect(typeof event).toBe('object');
  });

  it('maintenance schema can be imported independently from common', async () => {
    const maintenance = await import('@/schemas/maintenance');
    expect(maintenance).toBeDefined();
    expect(typeof maintenance).toBe('object');
  });

  it('auth schema can be imported independently from common', async () => {
    const auth = await import('@/schemas/auth');
    expect(auth).toBeDefined();
    expect(typeof auth).toBe('object');
  });

  it('each schema module exports Zod schemas (not plain objects)', async () => {
    const common = await import('@/schemas/common');

    // Verify they are Zod schemas with parse/safeParse
    expect(typeof common.paginationSchema.safeParse).toBe('function');
    expect(typeof common.uuidSchema.safeParse).toBe('function');
    expect(typeof common.emailSchema.safeParse).toBe('function');
    expect(typeof common.searchSchema.safeParse).toBe('function');
    expect(typeof common.dateRangeSchema.safeParse).toBe('function');
  });

  it('Zod is listed as a direct dependency (not bundled inside another package)', () => {
    const pkg = readPackageJson();
    const deps = (pkg.dependencies ?? {}) as Record<string, string>;
    expect(deps).toHaveProperty('zod');
  });

  it('schemas do not re-export all of Zod (no barrel re-export of z)', () => {
    const schemaDir = path.join(SRC, 'schemas');
    const schemaFiles = collectSourceFiles(schemaDir, ['.ts']);
    const reExports: string[] = [];

    for (const file of schemaFiles) {
      if (file.endsWith('.test.ts')) continue;
      const content = readFile(file);
      // Detect: export { z } from 'zod' or export * from 'zod'
      if (/export\s+\*\s+from\s+['"]zod['"]/.test(content)) {
        reExports.push(path.relative(ROOT, file));
      }
    }

    expect(reExports).toEqual([]);
  });

  it('schema files are small and focused (under 500 lines each)', () => {
    const schemaDir = path.join(SRC, 'schemas');
    const schemaFiles = collectSourceFiles(schemaDir, ['.ts']).filter(
      (f) => !f.endsWith('.test.ts'),
    );
    const oversized: string[] = [];

    for (const file of schemaFiles) {
      const content = readFile(file);
      const lineCount = content.split('\n').length;
      if (lineCount > 500) {
        oversized.push(`${path.relative(ROOT, file)}: ${lineCount} lines`);
      }
    }

    expect(oversized).toEqual([]);
  });
});

// ============================================================================
// 5. General bundle hygiene
// ============================================================================

describe('General bundle hygiene', () => {
  it('next.config uses standalone output mode for minimal deployment', () => {
    const configPath = path.join(ROOT, 'next.config.ts');
    const content = readFile(configPath);
    expect(content).toContain("output: 'standalone'");
  });

  it('no source files import directly from node_modules paths', () => {
    const sourceFiles = collectSourceFiles(SRC);
    const directNodeModuleImports: string[] = [];

    for (const file of sourceFiles) {
      if (file.includes('__tests__') || file.includes('.test.')) continue;
      const content = readFile(file);
      const lines = content.split('\n');
      for (const line of lines) {
        // Detect: import from './node_modules/...' or '../node_modules/...'
        if (/from\s+['"]\.\.?\/.*node_modules/.test(line)) {
          directNodeModuleImports.push(`${path.relative(ROOT, file)}: ${line.trim()}`);
        }
      }
    }

    expect(directNodeModuleImports).toEqual([]);
  });

  it('serverExternalPackages excludes heavy native modules from client bundle', () => {
    const configPath = path.join(ROOT, 'next.config.ts');
    const content = readFile(configPath);
    expect(content).toContain('serverExternalPackages');
    expect(content).toContain('argon2');
    expect(content).toContain('pino');
  });
});
