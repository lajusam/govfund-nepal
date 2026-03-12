/**
 * Nepal province data, Himalayan peaks, cities, and terrain utilities
 * for 3D terrain map rendering.
 *
 * Nepal bounds: Lat 26.3°–30.4°N, Lon 80.0°–88.2°E
 * Local 3D space: x [-7, 7], z [-3.5, 3.5], y = height
 */

// ── Coordinate conversions ──
export function toLocal(lon, lat) {
  const x = ((lon - 80.0) / 8.2) * 14 - 7;
  const z = ((lat - 26.3) / 4.1) * 7 - 3.5;
  return [x, z];
}

export function toGeo(x, z) {
  const lon = ((x + 7) / 14) * 8.2 + 80.0;
  const lat = ((z + 3.5) / 7) * 4.1 + 26.3;
  return [lon, lat];
}

// ── Province colors matching reference map ──
export const PROVINCE_COLORS = {
  1: [0.29, 0.48, 0.71],  // Koshi — Blue
  2: [0.88, 0.83, 0.29],  // Madhesh — Yellow
  3: [0.77, 0.56, 0.69],  // Bagmati — Pink/Magenta
  4: [0.55, 0.50, 0.71],  // Gandaki — Lavender
  5: [0.44, 0.66, 0.44],  // Lumbini — Green
  6: [0.77, 0.56, 0.25],  // Karnali — Orange/Brown
  7: [0.72, 0.35, 0.35],  // Sudurpashchim — Red
};

export const PROVINCE_HEX = {
  1: '#4B7BB5',
  2: '#E0D44A',
  3: '#C490B0',
  4: '#8B7FB5',
  5: '#70A870',
  6: '#C49040',
  7: '#B85858',
};

// ── Province boundary polygons [lon, lat] ──
export const PROVINCE_SHAPES = {
  1: {
    name: 'Koshi', nameNe: 'कोशी', capital: 'Biratnagar',
    center: [87.3, 27.4],
    points: [
      [87.0, 26.4], [87.8, 26.4], [88.2, 26.7], [88.2, 27.1],
      [88.0, 27.6], [87.8, 27.9], [87.5, 28.0], [87.2, 27.8],
      [86.8, 27.8], [86.5, 27.5], [86.5, 27.2], [86.6, 26.8],
      [86.8, 26.5], [87.0, 26.4],
    ],
  },
  2: {
    name: 'Madhesh', nameNe: 'मधेश', capital: 'Janakpur',
    center: [85.9, 26.7],
    points: [
      [85.3, 26.3], [86.0, 26.3], [86.6, 26.4], [86.8, 26.5],
      [86.6, 26.8], [86.5, 27.0], [86.2, 27.1], [85.8, 27.2],
      [85.4, 27.1], [85.2, 26.9], [85.0, 26.7], [85.0, 26.5],
      [85.1, 26.3], [85.3, 26.3],
    ],
  },
  3: {
    name: 'Bagmati', nameNe: 'बागमती', capital: 'Hetauda',
    center: [85.5, 27.7],
    points: [
      [84.8, 27.2], [85.2, 26.9], [85.4, 27.1], [85.8, 27.2],
      [86.2, 27.1], [86.5, 27.2], [86.5, 27.5], [86.2, 27.8],
      [85.9, 28.0], [85.6, 28.2], [85.2, 28.3], [84.9, 28.1],
      [84.7, 27.8], [84.6, 27.5], [84.8, 27.2],
    ],
  },
  4: {
    name: 'Gandaki', nameNe: 'गण्डकी', capital: 'Pokhara',
    center: [84.2, 28.2],
    points: [
      [83.5, 27.6], [83.9, 27.4], [84.3, 27.3], [84.6, 27.5],
      [84.7, 27.8], [84.9, 28.1], [85.2, 28.3], [85.0, 28.7],
      [84.7, 29.0], [84.3, 29.2], [83.9, 29.0], [83.6, 28.7],
      [83.3, 28.3], [83.3, 27.9], [83.5, 27.6],
    ],
  },
  5: {
    name: 'Lumbini', nameNe: 'लुम्बिनी', capital: 'Deukhuri',
    center: [83.2, 27.5],
    points: [
      [82.5, 27.0], [82.8, 26.7], [83.2, 26.5], [83.7, 26.6],
      [84.2, 26.8], [84.5, 27.0], [84.8, 27.2], [84.3, 27.3],
      [83.9, 27.4], [83.5, 27.6], [83.3, 27.9], [83.0, 28.1],
      [82.7, 28.0], [82.4, 27.7], [82.3, 27.3], [82.5, 27.0],
    ],
  },
  6: {
    name: 'Karnali', nameNe: 'कर्णाली', capital: 'Birendranagar',
    center: [82.0, 29.0],
    points: [
      [81.3, 28.3], [81.7, 28.0], [82.3, 27.3], [82.4, 27.7],
      [82.7, 28.0], [83.0, 28.1], [83.3, 28.3], [83.3, 28.7],
      [83.0, 29.2], [82.7, 29.5], [82.3, 29.8], [81.9, 30.0],
      [81.5, 29.8], [81.2, 29.4], [81.0, 28.9], [81.1, 28.5],
      [81.3, 28.3],
    ],
  },
  7: {
    name: 'Sudurpashchim', nameNe: 'सुदूरपश्चिम', capital: 'Godawari',
    center: [80.7, 29.2],
    points: [
      [80.0, 28.4], [80.3, 28.1], [80.7, 27.8], [81.0, 27.5],
      [81.3, 27.3], [81.7, 28.0], [81.3, 28.3], [81.1, 28.5],
      [81.0, 28.9], [81.2, 29.4], [81.5, 29.8], [81.2, 30.2],
      [80.8, 30.4], [80.4, 30.2], [80.1, 29.8], [80.0, 29.4],
      [80.0, 28.8], [80.0, 28.4],
    ],
  },
};

// ── Himalayan Peaks ──
export const PEAKS = [
  { name: 'Mt. Everest',     elevation: 8848, lon: 86.925, lat: 27.988 },
  { name: 'Kanchenjunga',    elevation: 8586, lon: 88.146, lat: 27.703 },
  { name: 'Lhotse',          elevation: 8516, lon: 86.933, lat: 27.962 },
  { name: 'Makalu',          elevation: 8485, lon: 87.089, lat: 27.889 },
  { name: 'Dhaulagiri',      elevation: 8167, lon: 83.487, lat: 28.698 },
  { name: 'Manaslu',         elevation: 8163, lon: 84.559, lat: 28.550 },
  { name: 'Annapurna',       elevation: 8091, lon: 83.820, lat: 28.596 },
];

// ── Major Cities ──
export const CITIES = [
  { name: 'Kathmandu',       lon: 85.324, lat: 27.717 },
  { name: 'Pokhara',         lon: 83.985, lat: 28.210 },
  { name: 'Biratnagar',      lon: 87.283, lat: 26.455 },
  { name: 'Nepalgunj',       lon: 81.617, lat: 28.050 },
  { name: 'Mahendranagar',   lon: 80.371, lat: 28.960 },
];

// ── Point-in-polygon (ray casting) ──
export function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Find province for a (lon, lat) coordinate ──
export function findProvince(lon, lat) {
  for (const [id, data] of Object.entries(PROVINCE_SHAPES)) {
    if (pointInPolygon(lon, lat, data.points)) return Number(id);
  }
  return null;
}

// ═══════════════════════════════════════════
//  TERRAIN NOISE — Deterministic Perlin-like
// ═══════════════════════════════════════════

// Seeded permutation table
const perm = new Uint8Array(512);
(function initPerm() {
  const base = Array.from({ length: 256 }, (_, i) => i);
  let seed = 42;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 256; i++) {
    perm[i] = base[i];
    perm[i + 256] = base[i];
  }
})();

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }

function grad2D(hash, x, y) {
  const h = hash & 3;
  return ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
}

export function noise2D(x, y) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X + 1] + Y];
  const bb = perm[perm[X + 1] + Y + 1];
  return lerp(
    lerp(grad2D(aa, xf, yf), grad2D(ba, xf - 1, yf), u),
    lerp(grad2D(ab, xf, yf - 1), grad2D(bb, xf - 1, yf - 1), u),
    v
  );
}

export function fbm(x, y, octaves = 6) {
  let value = 0, amplitude = 1, frequency = 1, maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude;
    maxAmp += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / maxAmp;
}

// ── Compute terrain height at a geographic coordinate ──
export function computeTerrainHeight(lon, lat) {
  const latNorm = (lat - 26.3) / (30.4 - 26.3); // 0=south, 1=north

  // Elevation profile: Terai → Siwalik → Middle Hills → High Himalayas → Trans-Himalaya
  let base;
  if (latNorm < 0.18) {
    base = 0.02 + latNorm * 0.2;
  } else if (latNorm < 0.32) {
    const t = (latNorm - 0.18) / 0.14;
    base = 0.06 + t * 0.5;
  } else if (latNorm < 0.48) {
    const t = (latNorm - 0.32) / 0.16;
    base = 0.56 + t * 0.8;
  } else if (latNorm < 0.72) {
    const t = (latNorm - 0.48) / 0.24;
    base = 1.36 + t * 1.8;
  } else {
    const t = (latNorm - 0.72) / 0.28;
    base = 3.16 - t * 0.6; // Trans-Himalaya plateau dips slightly
  }

  // Fractal noise — more intense at higher elevations
  const noiseAmp = latNorm < 0.2 ? 0.04 : latNorm < 0.48 ? 0.25 : 0.55;
  base += fbm(lon * 3, lat * 3, 5) * noiseAmp;
  // Finer detail noise
  base += fbm(lon * 8 + 100, lat * 8 + 100, 3) * noiseAmp * 0.3;

  // Gaussian peaks for known mountains
  for (const peak of PEAKS) {
    const dx = lon - peak.lon;
    const dy = lat - peak.lat;
    const dist2 = dx * dx + dy * dy;
    const sigma = 0.06 + (peak.elevation / 80000);
    const peakH = (peak.elevation / 8848) * 1.6;
    base += peakH * Math.exp(-dist2 / (2 * sigma * sigma));
  }

  return Math.max(0, base);
}

// ── Terrain color based on elevation (natural tones) ──
export function terrainColor(height) {
  if (height < 0.1) return [0.42, 0.55, 0.28];       // Deep green (Terai)
  if (height < 0.4) return [0.50, 0.60, 0.30];        // Light green (foothills)
  if (height < 1.0) return [0.55, 0.50, 0.35];        // Olive (middle hills)
  if (height < 1.8) return [0.60, 0.48, 0.32];        // Brown (high hills)
  if (height < 2.8) return [0.55, 0.50, 0.48];        // Gray rock
  return [0.92, 0.92, 0.95];                           // Snow white
}
