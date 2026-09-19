/**
 * Deterministic offline `data:` URI photos and avatars - no third-party host to rate-limit, go
 * down, or differ between CI and local runs.
 */

const PALETTE = ["#b3623f", "#4a7a5c", "#c99a3f", "#3f6f8f", "#8a4a6b", "#6f7a3f"];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** A solid-color square, sized for `Avatar`/`AvatarGroup` fallback images. */
export function placeholderAvatar(seed: string, size = 150): string {
  const color = PALETTE[hashSeed(seed) % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A two-tone gradient rectangle, sized for `Image`/`AspectRatio` photo stand-ins. */
export function placeholderPhoto(seed: string, width = 800, height = 450): string {
  const hash = hashSeed(seed);
  const from = PALETTE[hash % PALETTE.length];
  const to = PALETTE[(hash + 1) % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
