export const COLORS = {
  bg: '#0a0a0a',
  bgDeep: '#050505',
  surface: '#161616',
  surfaceLight: '#1a1a1a',
  surfaceGlass: 'rgba(22, 22, 22, 0.55)',
  brand: '#0ea5e9',
  brandEnd: '#22d3ee',
  brandGlow: 'rgba(14, 165, 233, 0.35)',
  text: '#e5e5e5',
  textSecondary: '#a3a3a3',
  textMuted: '#525252',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  gold: '#fbbf24',
} as const;

export const GRADIENTS = {
  brand: 'linear-gradient(135deg, #0ea5e9, #22d3ee)',
  gold: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  dark: 'linear-gradient(180deg, #050505, #161616)',
  radialBrand: 'radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, transparent 70%)',
  radialGold: 'radial-gradient(ellipse at center, rgba(251,191,36,0.12) 0%, transparent 70%)',
} as const;

export const FONTS = {
  heading: "'Space Grotesk', 'Inter', sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const SHADOW = {
  brand: '0 0 40px rgba(14, 165, 233, 0.4), 0 0 80px rgba(14, 165, 233, 0.15)',
  gold: '0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.15)',
  glass: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
} as const;
