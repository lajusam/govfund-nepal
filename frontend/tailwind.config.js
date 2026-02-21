/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // ── Cinematic Design System ──────────────────────────
                void: '#060608',          // page background, absolute dark
                surface: '#0D0D10',       // card / section backgrounds
                elevate: '#141418',       // raised elements, nav
                border: 'rgba(255,255,255,0.07)',
                // ── Nepal accent (crimson-neon) ──
                crimson: {
                    DEFAULT: '#FF1A3C',
                    glow:    'rgba(255,26,60,0.45)',
                    soft:    'rgba(255,26,60,0.12)',
                    muted:   '#CC1530',
                },
                // ── Electric Blue (primary CTA accent) ──
                electric: {
                    DEFAULT: '#0A5FFF',
                    light:   '#3D7EFF',
                    glow:    'rgba(10,95,255,0.45)',
                    soft:    'rgba(10,95,255,0.12)',
                },
                // ── Gold (stats / highlights) ──
                gold: {
                    DEFAULT: '#E8B84B',
                    soft:    'rgba(232,184,75,0.12)',
                },
                // ── Legacy nepal.* retained for other pages ──
                nepal: {
                    red: '#DC143C',
                    'red-dark': '#A0102D',
                    'red-muted': '#c0392b',
                    navy: '#1B1F3B',
                    'navy-light': '#2C3154',
                    blue: '#3498db',
                    'blue-soft': '#5DADE2',
                    charcoal: '#1a1a2e',
                    'charcoal-light': '#16213e',
                    stone: '#F5F1EB',
                    'stone-dark': '#E8E0D5',
                    gold: '#D4A843',
                },
            },
            fontFamily: {
                display: ['Syne', 'system-ui', 'sans-serif'],
                sans:    ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
                heading: ['Syne', 'Space Grotesk', 'sans-serif'],
                mono:    ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'float':          'float 7s ease-in-out infinite',
                'glow-blue':      'glowBlue 3s ease-in-out infinite alternate',
                'glow-crimson':   'glowCrimson 3s ease-in-out infinite alternate',
                'marquee':        'marquee 22s linear infinite',
                'fade-in':        'fadeIn 0.6s ease-out',
                'grid-flow':      'gridFlow 20s linear infinite',
                'cursor-ring':    'cursorRing 0.6s ease-out',
                'spin-slow':      'spin 40s linear infinite',
                'pulse-slow':     'pulse 4s ease-in-out infinite',
                'noise':          'noiseAnim 0.15s steps(1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '33%':      { transform: 'translateY(-18px) rotate(1deg)' },
                    '66%':      { transform: 'translateY(8px) rotate(-1deg)' },
                },
                glowBlue: {
                    from: { boxShadow: '0 0 15px rgba(10,95,255,0.2), 0 0 30px rgba(10,95,255,0.08)' },
                    to:   { boxShadow: '0 0 35px rgba(10,95,255,0.5), 0 0 70px rgba(10,95,255,0.15)' },
                },
                glowCrimson: {
                    from: { boxShadow: '0 0 15px rgba(255,26,60,0.2)' },
                    to:   { boxShadow: '0 0 35px rgba(255,26,60,0.5), 0 0 70px rgba(255,26,60,0.15)' },
                },
                marquee: {
                    from: { transform: 'translateX(0)' },
                    to:   { transform: 'translateX(-50%)' },
                },
                fadeIn: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
                gridFlow: {
                    from: { transform: 'translate(0,0)' },
                    to:   { transform: 'translate(60px,60px)' },
                },
                cursorRing: {
                    '0%':   { transform: 'translate(-50%,-50%) scale(0)', opacity: '1' },
                    '100%': { transform: 'translate(-50%,-50%) scale(2.5)', opacity: '0' },
                },
                noiseAnim: {
                    '0%':   { transform: 'translate(0,0)' },
                    '25%':  { transform: 'translate(-3%,-3%)' },
                    '50%':  { transform: 'translate(3%,3%)' },
                    '75%':  { transform: 'translate(-2%,2%)' },
                    '100%': { transform: 'translate(2%,-2%)' },
                },
            },
            backgroundImage: {
                'grid-void': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M60 0H0v60' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='0.5'/%3E%3C/svg%3E\")",
                'dot-void':  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='rgba(255,255,255,0.07)'/%3E%3C/svg%3E\")",
                'dhaka-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23DC143C' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            },
        },
    },
    plugins: [],
};
