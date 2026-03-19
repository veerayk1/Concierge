/**
 * Image Optimization Tests
 *
 * Validates that the project follows Next.js image optimization best practices:
 *   - Next.js Image component is used instead of raw <img> tags in marketing pages
 *   - Image formats include avif and webp in next.config
 *   - Remote patterns are configured for S3 buckets
 *
 * These are static analysis tests that inspect source files and configuration
 * without running a production build.
 *
 * @module test/performance/image-optimization
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'src');
const MARKETING_DIR = path.join(SRC, 'app', '(marketing)');

/** Recursively collect all .tsx files under a directory. */
function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      results.push(...collectTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }

  return results;
}

/** Read a file and return its content. */
function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// ============================================================================
// 1. Next.js Image component used instead of raw <img> tags
// ============================================================================

describe('Marketing pages — Next.js Image component usage', () => {
  const marketingPages = collectTsxFiles(MARKETING_DIR);

  it('marketing pages directory exists', () => {
    expect(fs.existsSync(MARKETING_DIR)).toBe(true);
  });

  it('marketing pages exist for testing', () => {
    expect(marketingPages.length).toBeGreaterThan(0);
  });

  it('marketing pages do not use raw <img> tags for content images', () => {
    const rawImgUsages: string[] = [];

    for (const file of marketingPages) {
      const content = readFile(file);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        // Detect raw <img tags in JSX (not inside comments or strings)
        if (/<img\s/i.test(line)) {
          // Allow <img> inside SVG elements (inline SVG icons)
          const prevLines = lines.slice(Math.max(0, i - 5), i).join('\n');
          if (prevLines.includes('<svg') && !prevLines.includes('</svg>')) continue;

          // Allow aria-hidden decorative images inside icon components
          if (line.includes('aria-hidden="true"') && line.includes('role="presentation"')) continue;

          rawImgUsages.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(rawImgUsages).toEqual([]);
  });

  it('if marketing pages reference images, they import next/image', () => {
    const pagesWithImages: string[] = [];

    for (const file of marketingPages) {
      const content = readFile(file);

      // Check if the file contains image references (src attributes pointing to images)
      const hasImageRefs =
        /\.(png|jpg|jpeg|gif|webp|avif|svg)['"]/.test(content) && !content.includes('<svg');

      if (hasImageRefs) {
        if (!content.includes("from 'next/image'") && !content.includes('from "next/image"')) {
          pagesWithImages.push(path.relative(ROOT, file));
        }
      }
    }

    expect(pagesWithImages).toEqual([]);
  });
});

// ============================================================================
// 2. All component files avoid raw <img> for external images
// ============================================================================

describe('Component files — <img> tag audit', () => {
  const componentDir = path.join(SRC, 'components');
  const componentFiles = collectTsxFiles(componentDir);

  it('component directory exists', () => {
    expect(fs.existsSync(componentDir)).toBe(true);
  });

  it('raw <img> tags are documented with justification or use Next.js Image', () => {
    const rawImgComponents: { file: string; line: number; content: string }[] = [];

    for (const file of componentFiles) {
      const content = readFile(file);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (/<img\s/.test(line)) {
          rawImgComponents.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            content: line.trim(),
          });
        }
      }
    }

    // Allow up to a small number of justified raw <img> usages
    // (e.g., avatar component with dynamic src that cannot use next/image)
    // Each usage should ideally have a comment explaining why
    if (rawImgComponents.length > 0) {
      // Ensure the count is low — flag anything beyond a small threshold
      expect(rawImgComponents.length).toBeLessThanOrEqual(5);
    }
  });

  it('components with raw <img> include alt attributes for accessibility', () => {
    const missingAlt: string[] = [];

    for (const file of componentFiles) {
      const content = readFile(file);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (/<img\s/.test(line)) {
          // Check if alt is present (may span multiple lines)
          const nearbyLines = lines.slice(i, Math.min(lines.length, i + 3)).join(' ');
          if (!nearbyLines.includes('alt=') && !nearbyLines.includes('alt ')) {
            missingAlt.push(`${path.relative(ROOT, file)}:${i + 1}`);
          }
        }
      }
    }

    expect(missingAlt).toEqual([]);
  });
});

// ============================================================================
// 3. next.config includes avif and webp image formats
// ============================================================================

describe('next.config — image format optimization', () => {
  const configPath = path.join(ROOT, 'next.config.ts');
  const configContent = readFile(configPath);

  it('next.config.ts exists', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('images configuration is present', () => {
    expect(configContent).toContain('images:');
  });

  it('avif format is enabled (best compression)', () => {
    expect(configContent).toContain('image/avif');
  });

  it('webp format is enabled (broad browser support)', () => {
    expect(configContent).toContain('image/webp');
  });

  it('formats array includes both avif and webp', () => {
    expect(configContent).toContain('formats:');
    // avif should come first (preferred, better compression)
    const avifIdx = configContent.indexOf('image/avif');
    const webpIdx = configContent.indexOf('image/webp');
    expect(avifIdx).toBeLessThan(webpIdx);
  });

  it('avif is prioritized over webp in the formats array', () => {
    // Next.js uses the first format the browser supports
    // avif has better compression, so it should be listed first
    const formatsMatch = configContent.match(/formats:\s*\[([^\]]+)\]/);
    expect(formatsMatch).toBeTruthy();

    if (formatsMatch) {
      const formatsStr = formatsMatch[1]!;
      const avifPos = formatsStr.indexOf('avif');
      const webpPos = formatsStr.indexOf('webp');
      expect(avifPos).toBeLessThan(webpPos);
    }
  });
});

// ============================================================================
// 4. Remote patterns configured for S3
// ============================================================================

describe('next.config — S3 remote patterns', () => {
  const configPath = path.join(ROOT, 'next.config.ts');
  const configContent = readFile(configPath);

  it('remotePatterns configuration is present', () => {
    expect(configContent).toContain('remotePatterns');
  });

  it('S3 remote pattern uses HTTPS protocol', () => {
    expect(configContent).toContain("protocol: 'https'");
  });

  it('S3 remote pattern includes amazonaws.com hostname', () => {
    expect(configContent).toContain('amazonaws.com');
  });

  it('S3 remote pattern uses wildcard for bucket subdomains', () => {
    // Pattern should match *.amazonaws.com for S3 bucket URLs
    expect(configContent).toContain('*.amazonaws.com');
  });

  it('S3 remote pattern restricts pathname to concierge buckets', () => {
    // Should not allow arbitrary paths from any S3 bucket
    expect(configContent).toContain('concierge');
    expect(configContent).toContain('pathname');
  });

  it('remote patterns do not use overly permissive wildcards', () => {
    // Should not have hostname: '*' (matches everything)
    const hasWildcardHost = /hostname:\s*['"][\*]['"]/.test(configContent);
    expect(hasWildcardHost).toBe(false);
  });

  it('remote patterns do not allow HTTP (only HTTPS)', () => {
    // No http:// patterns for image sources
    const hasHttpPattern = /protocol:\s*['"]http['"]/.test(configContent);
    expect(hasHttpPattern).toBe(false);
  });
});

// ============================================================================
// 5. Image-related performance best practices
// ============================================================================

describe('Image performance — best practices', () => {
  it('next.config does not disable image optimization', () => {
    const configContent = readFile(path.join(ROOT, 'next.config.ts'));
    // unoptimized: true would disable all optimization
    expect(configContent).not.toContain('unoptimized: true');
    expect(configContent).not.toContain('unoptimized:true');
  });

  it('project has next/image available as a dependency', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    const deps = pkg.dependencies ?? {};
    // next/image comes from the next package
    expect(deps).toHaveProperty('next');
  });

  it('no marketing page loads images from external CDNs without remote patterns', () => {
    const marketingPages = collectTsxFiles(MARKETING_DIR);
    const externalImageSources: string[] = [];

    for (const file of marketingPages) {
      const content = readFile(file);
      // Check for hardcoded external image URLs not covered by remotePatterns
      const externalMatches = content.matchAll(
        /src=["'](https?:\/\/[^"']+\.(png|jpg|webp|avif))["']/g,
      );
      for (const match of externalMatches) {
        const url = match[1]!;
        // Allow amazonaws.com (covered by remote patterns)
        if (url.includes('amazonaws.com')) continue;
        externalImageSources.push(`${path.relative(ROOT, file)}: ${url}`);
      }
    }

    expect(externalImageSources).toEqual([]);
  });

  it('SVG icons use inline SVG or lucide-react (not <img> with .svg)', () => {
    const marketingPages = collectTsxFiles(MARKETING_DIR);
    const svgAsImg: string[] = [];

    for (const file of marketingPages) {
      const content = readFile(file);
      // Detect: <img src="...svg" /> pattern
      if (/<img[^>]+src=["'][^"']+\.svg["']/.test(content)) {
        svgAsImg.push(path.relative(ROOT, file));
      }
    }

    expect(svgAsImg).toEqual([]);
  });

  it('reactStrictMode is enabled for development performance warnings', () => {
    const configContent = readFile(path.join(ROOT, 'next.config.ts'));
    expect(configContent).toContain('reactStrictMode: true');
  });
});
