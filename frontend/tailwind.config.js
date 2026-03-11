/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // shadcn/ui compat tokens
                background: 'rgb(var(--background) / <alpha-value>)',
                foreground: 'rgb(var(--foreground) / <alpha-value>)',
                primary:    'rgb(var(--primary) / <alpha-value>)',
                muted:      'rgb(var(--muted) / <alpha-value>)',
                border:     'rgb(var(--border) / <alpha-value>)',

                // ══════════════════════════════════════════════════════════════
                // GOVFUND NEPAL — DARK CINEMATIC COLOR SYSTEM
                // Deep Basalt × Earth Brown × Parchment × Golden Sun × Bronze
                // ══════════════════════════════════════════════════════════════

                // Gov aliases (kept for compat with any gov-* usage in JSX)
                'gov-navy': {
                    DEFAULT: '#1A160F',
                    light:   '#2D2518',
                    dark:    '#0D0B07',
                },
                'gov-slate': {
                    DEFAULT: '#8E6F3E',
                    light:   '#A8875A',
                    dark:    '#6E5428',
                },
                'gov-blue-light': '#F5F1E6',

                'gov-white':   '#F5F1E6',
                'gov-surface': '#2D2518',
                'gov-charcoal':'#F5F1E6',
                'gov-gray':    '#C4A96E',
                'gov-border':  'rgba(142,111,62,0.28)',

                'gov-amber': {
                    DEFAULT: '#FFB81C',
                    hover:   '#E09500',
                    light:   '#FFF0CC',
                    50:  '#FFF8E6',
                    100: '#FFF0CC',
                    200: '#FFE099',
                    300: '#FFD166',
                    400: '#FFC333',
                    500: '#FFB81C',
                    600: '#E09F00',
                    700: '#B07C00',
                },

                // Semantic Colors — never decorative
                'gov-green':  '#1E7F4E',
                'gov-orange': '#C2410C',
                'gov-red':    '#9B1C1C',
                'gov-info':   '#2563EB',

                // Figma system — Brand / Subtle + State tokens
                'gov-subtle':        '#8E6F3E',
                'gov-selected':      '#342B1A',
                'gov-hover-bg':      '#3D3020',
                'gov-border-strong': 'rgba(142,111,62,0.50)',
                'gov-divider':       'rgba(142,111,62,0.14)',

                // Page Background — Deep Basalt
                basalt: {
                    DEFAULT: '#1A160F',
                    50:  '#F5F1E6',
                    100: '#EDE5CC',
                    200: '#D4C49A',
                    300: '#BBA468',
                    400: '#8E6F3E',
                    500: '#5C4420',
                    600: '#3D2E16',
                    700: '#2D2518',
                    800: '#1A160F',
                    900: '#0D0B07',
                    950: '#060503',
                },

                // Surface / Cards — Earth Brown
                earth: {
                    DEFAULT: '#2D2518',
                    light:   '#3D3020',
                    lighter: '#4A3A26',
                    raised:  '#342B1A',
                    dark:    '#1A160F',
                    border:  'rgba(142,111,62,0.30)',
                },

                // Primary Text — Parchment
                parchment: {
                    DEFAULT: '#F5F1E6',
                    dim:     '#E8DCBF',
                    muted:   '#C4A96E',
                    ghost:   '#8E7550',
                },

                // Primary Button — Golden Sun
                golden: {
                    DEFAULT: '#FFB81C',
                    50:  '#FFF8E6',
                    100: '#FFF0CC',
                    200: '#FFE099',
                    300: '#FFD166',
                    400: '#FFC333',
                    500: '#FFB81C',
                    600: '#E09F00',
                    700: '#B07C00',
                    800: '#7A5600',
                    900: '#4A3400',
                    950: '#261B00',
                },

                // Secondary Button — Muted Bronze
                bronze: {
                    DEFAULT: '#8E6F3E',
                    light:   '#A8875A',
                    dark:    '#6E5428',
                    border:  'rgba(142,111,62,0.50)',
                },

                // Link / Nav Hover — Amber Glow
                'amber-glow': {
                    DEFAULT: '#FAD980',
                    dim:     '#F0C850',
                    bright:  '#FFE9A0',
                },

                nepal: {
                    red:              '#FFB81C',
                    'red-dark':       '#E09500',
                    'red-muted':      '#B07400',
                    navy:             '#1A160F',
                    'navy-light':     '#2D2518',
                    blue:             '#FAD980',
                    'blue-soft':      '#FFEAA8',
                    charcoal:         '#1A160F',
                    'charcoal-light': '#2D2518',
                    stone:            '#F5F1E6',
                    'stone-dark':     '#E0D5B5',
                    gold:             '#8E6F3E',
                },
            },

            fontFamily: {
                sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                heading: ['Outfit', 'Inter', 'sans-serif'],
                mono:    ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },

            boxShadow: {
                'golden-sm':   '0 2px 10px 0 rgba(255,184,28,0.22)',
                'golden-md':   '0 4px 24px 0 rgba(255,184,28,0.32)',
                'golden-lg':   '0 8px 48px 0 rgba(255,184,28,0.42)',
                'golden-xl':   '0 16px 72px 0 rgba(255,184,28,0.50)',
                'basalt-md':   '0 4px 24px 0 rgba(13,11,7,0.62)',
                'basalt-lg':   '0 8px 48px 0 rgba(13,11,7,0.78)',
                'basalt-xl':   '0 16px 64px 0 rgba(13,11,7,0.88)',
                'card':        '0 4px 32px rgba(13,11,7,0.58), inset 0 1px 0 rgba(250,217,128,0.07)',
                'card-hover':  '0 10px 60px rgba(13,11,7,0.80), 0 0 0 1px rgba(255,184,28,0.22)',
                'card-accent': '0 4px 20px rgba(13,11,7,0.60), -3px 0 0 #8E6F3E',
                'amber-sm':    '0 2px 10px 0 rgba(255,184,28,0.22)',
                'amber-md':    '0 4px 24px 0 rgba(255,184,28,0.30)',
                'amber-lg':    '0 8px 48px 0 rgba(255,184,28,0.38)',
                'amber-xl':    '0 16px 60px 0 rgba(255,184,28,0.42)',
                'inner-amber': 'inset 0 1px 0 rgba(255,184,28,0.15)',
                'focus-ring':  '0 0 0 3px rgba(142,111,62,0.40)',
                'focus-ring-amber': '0 0 0 3px rgba(255,184,28,0.45)',
                'metric':      '0 2px 8px rgba(13,11,7,0.50)',
                'nav':         '0 2px 16px rgba(13,11,7,0.70)',
            },

            animation: {
                'float':        'float 6s ease-in-out infinite',
                'glow-golden':  'glowGov 3s ease-in-out infinite alternate',
                'glow-amber':   'glowGov 3s ease-in-out infinite alternate',
                'glow':         'glowGov 3s ease-in-out infinite alternate',
                'slide-up':     'slideUp 0.6s cubic-bezier(0.22,1,0.36,1)',
                'fade-in':      'fadeIn 0.5s ease-out',
                'shimmer':      'shimmer 2.2s linear infinite',
                'pulse-golden': 'pulseGov 2s ease-in-out infinite',
                'scan-line':      'scanLine 3s linear infinite',
                'scale-in':       'scaleIn 0.35s cubic-bezier(0.22,1,0.36,1)',
                'slide-in-left':  'slideInLeft 0.45s cubic-bezier(0.22,1,0.36,1)',
                'slide-in-right': 'slideInRight 0.45s cubic-bezier(0.22,1,0.36,1)',
                'ripple':         'ripple 0.55s linear',
                'fade-slide-up':  'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1)',
            },

            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%':      { transform: 'translateY(-16px)' },
                },
                glowGov: {
                    from: { boxShadow: '0 0 14px rgba(255,184,28,0.30)' },
                    to:   { boxShadow: '0 0 36px rgba(255,184,28,0.65), 0 0 72px rgba(255,184,28,0.20)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(28px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to:   { opacity: '1' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition:  '200% center' },
                },
                pulseGov: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%':      { opacity: '0.70', transform: 'scale(1.05)' },
                },
                scanLine: {
                    '0%':   { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(400%)' },
                },
                scaleIn: {
                    from: { opacity: '0', transform: 'scale(0.92)' },
                    to:   { opacity: '1', transform: 'scale(1)' },
                },
                slideInLeft: {
                    from: { opacity: '0', transform: 'translateX(-32px)' },
                    to:   { opacity: '1', transform: 'translateX(0)' },
                },
                slideInRight: {
                    from: { opacity: '0', transform: 'translateX(32px)' },
                    to:   { opacity: '1', transform: 'translateX(0)' },
                },
                ripple: {
                    '0%':   { transform: 'scale(0)', opacity: '0.45' },
                    '100%': { transform: 'scale(3.5)', opacity: '0' },
                },
                progressFill: {
                    from: { transform: 'scaleX(0)', transformOrigin: 'left' },
                    to:   { transform: 'scaleX(1)', transformOrigin: 'left' },
                },
                fadeSlideUp: {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
            },

            backgroundImage: {
                'basalt-grain':   "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
                'dhaka-pattern':  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFB81C' fill-opacity='0.035'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                'umber-pattern':  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFB81C' fill-opacity='0.035'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                'golden-radial':  'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(255,184,28,0.24) 0%, rgba(255,184,28,0.06) 55%, transparent 80%)',
                'amber-radial':   'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,184,28,0.18) 0%, transparent 70%)',
                'basalt-sweep':   'linear-gradient(135deg, #1A160F 0%, #2D2518 40%, #342B1A 60%, #1A160F 100%)',
                'golden-shimmer': 'linear-gradient(90deg, #8E6F3E 0%, #FFB81C 30%, #FAD980 50%, #FFB81C 70%, #8E6F3E 100%)',
                'umber-gradient': 'linear-gradient(135deg, #1A160F 0%, #2D2518 50%, #1A160F 100%)',
            },
        },
    },
    plugins: [],
};
