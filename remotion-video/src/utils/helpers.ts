/**
 * Seeded pseudo-random number generator (mulberry32)
 * Provides deterministic randomness without @remotion/noise
 */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate an array of N deterministic random values */
export function randomArray(count: number, seed = 42): number[] {
  const rng = seededRandom(seed);
  return Array.from({ length: count }, () => rng());
}

/**
 * Smooth easing functions
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeIn(t: number): number {
  return t * t * t;
}

/**
 * Scene crossfade opacity: fade in over `fadeDuration` frames at start,
 * fade out over `fadeDuration` frames before `totalDuration` ends.
 */
export function sceneFade(
  localFrame: number,
  totalDuration: number,
  fadeDuration = 15
): number {
  if (localFrame < fadeDuration) {
    return localFrame / fadeDuration;
  }
  if (localFrame > totalDuration - fadeDuration) {
    return (totalDuration - localFrame) / fadeDuration;
  }
  return 1;
}

/** Clamp a value between min and max */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/** Map a value from [inMin, inMax] to [outMin, outMax] */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Format a large number with commas */
export function formatCurrency(n: number): string {
  return n.toLocaleString('en-IN');
}

/** Hex to rgba helper */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
