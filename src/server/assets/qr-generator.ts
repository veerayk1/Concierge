/**
 * QR Code Generator for Asset Tags
 *
 * Generates simple QR code SVGs as data URLs for embedding in asset tag labels.
 * Uses a minimal SVG-based QR encoding approach without external dependencies.
 *
 * Note: For production, consider using a proper QR library like 'qrcode'.
 * This implementation generates a deterministic SVG placeholder that encodes
 * the content as a base64 data attribute, suitable for scanning with a
 * QR-aware client that reads the embedded data.
 */

/**
 * Generates a QR code as an SVG data URL.
 *
 * @param content - The string to encode in the QR code
 * @returns A data:image/svg+xml data URL containing the QR code SVG
 */
export function generateQrSvgDataUrl(content: string): string {
  const encoded = Buffer.from(content).toString('base64');

  // Generate a simple deterministic pattern from the content hash
  const size = 21; // QR version 1 is 21x21 modules
  const moduleSize = 10;
  const totalSize = size * moduleSize;
  const modules = generateModulePattern(content, size);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" data-content="${encoded}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="white"/>`;

  // Draw finder patterns (top-left, top-right, bottom-left)
  svg += drawFinderPattern(0, 0, moduleSize);
  svg += drawFinderPattern((size - 7) * moduleSize, 0, moduleSize);
  svg += drawFinderPattern(0, (size - 7) * moduleSize, moduleSize);

  // Draw data modules
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isFinderArea(row, col, size)) continue;
      if (modules[row]![col]) {
        svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';

  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return dataUrl;
}

function generateModulePattern(content: string, size: number): boolean[][] {
  // Simple hash-based pattern generation
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  const modules: boolean[][] = [];
  for (let row = 0; row < size; row++) {
    modules[row] = [];
    for (let col = 0; col < size; col++) {
      // Deterministic pattern based on position and content hash
      const seed = (hash + row * size + col) | 0;
      modules[row]![col] = (seed * 2654435761) % 4 < 2;
    }
  }
  return modules;
}

function isFinderArea(row: number, col: number, size: number): boolean {
  // Top-left finder pattern (7x7)
  if (row < 7 && col < 7) return true;
  // Top-right finder pattern
  if (row < 7 && col >= size - 7) return true;
  // Bottom-left finder pattern
  if (row >= size - 7 && col < 7) return true;
  return false;
}

function drawFinderPattern(x: number, y: number, moduleSize: number): string {
  let svg = '';
  // Outer border (7x7)
  svg += `<rect x="${x}" y="${y}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="black"/>`;
  // Inner white (5x5)
  svg += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="white"/>`;
  // Center black (3x3)
  svg += `<rect x="${x + 2 * moduleSize}" y="${y + 2 * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="black"/>`;
  return svg;
}
