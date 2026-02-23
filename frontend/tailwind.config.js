/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                // ══════════════════════════════════════════════════════════════
                // GOVFUND NEPAL — GOVERNMENT-GRADE COLOR SYSTEM
                // Official. Trustworthy. Accessible. Audit-friendly.
                // Deep Navy x Slate Blue x Light Blue-Gray x Muted Amber
                // Color is functional, not decorative.
                // ══════════════════════════════════════════════════════════════

                // Primary Government Blue System
                'gov-navy': {
                    DEFAULT: '#0B2A4A',
                    light:   '#1A3F64',
                    dark:    '#071C30',
                },
                'gov-slate': {
                    DEFAULT: '#2F5D8A',
                    light:   '#4A78A8',
                    dark:    '#1E4268',
                },
                'gov-blue-light': '#E6EEF6',

                // Neutral System (WCAG AA+, printer-safe, grayscale-safe)
                'gov-white':   '#FFFFFF',
                'gov-surface': '#F7F9FC',
                'gov-charcoal':'#1F2933',
                'gov-gray':    '#4B5563',
                'gov-border':  '#D1D5DB',

                // CTA Amber — 10% Rule — CTAs only
                'gov-amber': {
                    DEFAULT: '#E6A400',
                    hover:   '#C89200',
                    light:   '#FFF3CC',
                    50:  '#FFFBEB',
                    100: '#FFF3CC',
                    200: '#FFE499',
                    300: '#FFD166',
                    400: '#F0B800',
                    500: '#E6A400',
                    600: '#C89200',
                    700: '#A07200',
                },

                // Semantic Colors — never decorative
                'gov-green':  '#1E7F4E',
                'gov-orange': '#C2410C',
                'gov-red':    '#9B1C1C',
                'gov-info':   '#2563EB',

                // Figma system — Brand / Subtle + State tokens
                'gov-subtle':        '#4F7CA6', // Brand/Subtle — tabs, icons, highlights
                'gov-selected':      '#D6E4F0', // State/Selected — active tab bg
                'gov-hover-bg':      '#EBF2F9', // State/Hover — row/item hover bg
                'gov-border-strong': '#9CA3AF', // Border/Strong — table separators
                'gov-divider':       '#E5E7EB', // Divider/Subtle — section dividers

                // LEGACY ALIASES — All existing className refs auto-resolve.
                // basalt => Deep Navy (header, footer, dark hero)
                basalt: {
                    DEFAULT: '#0B2A4A',
                    50:  '#E6EEF6',
                    100: '#D1DEEE',
                    200: '#A3BDD8',
                    300: '#759CBF',
                    400: '#4A78A8',
                    500: '#2F5D8A',
                    600: '#1A3F64',
                    700: '#0B2A4A',
                    800: '#071C30',
                    900: '#040F1C',
                    950: '#020810',
                },

                // earth => Off-White / Light Blue-Gray surface system
                earth: {
                    DEFAULT: '#F7F9FC',
                    light:   '#E6EEF6',
                    lighter: '#F0F4F9',
                    raised:  '#FFFFFF',
                    dark:    '#D1D5DB',
                    border:  '#D1D5DB',
                },

                // parchment => Charcoal text system (dark text on light backgrounds)
                parchment: {
                    DEFAULT: '#1F2933',
                    dim:     '#374151',
                    muted:   '#4B5563',
                    ghost:   '#6B7280',
                },

                // golden => Muted Amber (CTAs only)
                golden: {
                    DEFAULT: '#E6A400',
                    50:  '#FFFBEB',
                    100: '#FFF3CC',
                    200: '#FFE499',
                    300: '#FFD166',
                    400: '#F0B800',
                    500: '#E6A400',
                    600: '#C89200',
                    700: '#A07200',
                    800: '#7A5600',
                    900: '#4A3400',
                    950: '#261B00',
                },

                // bronze => Slate Blue (secondary / outline / section headers)
                bronze: {
                    DEFAULT: '#2F5D8A',
                    light:   '#4A78A8',
                    dark:    '#1E4268',
                    border:  'rgba(47,93,138,0.28)',
                },

                // amber-glow => Dark Amber hover
                'amber-glow': {
                    DEFAULT: '#C89200',
                    dim:     '#A07200',
                    bright:  '#E6A400',
                },

                nepal: {
                    red:              '#E6A400',
                    'red-dark':       '#C89200',
                    'red-muted':      '#A07200',
                    navy:             '#0B2A4A',
                    'navy-light':     '#2F5D8A',
                    blue:             '#2F5D8A',
                    'blue-soft':      '#E6EEF6',
                    charcoal:         '#1F2933',
                    'charcoal-light': '#374151',
                    stone:            '#F7F9FC',
                    'stone-dark':     '#E6EEF6',
                    gold:             '#2F5D8A',
                },
            },

            fontFamily: {
                sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                heading: ['Outfit', 'Inter', 'sans-serif'],
                mono:    ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },

            boxShadow: {
                'golden-sm':   '0 2px 8px 0 rgba(230,164,0,0.20)',
                'golden-md':   '0 4px 18px 0 rgba(230,164,0,0.28)',
                'golden-lg':   '0 8px 32px 0 rgba(230,164,0,0.34)',
                'golden-xl':   '0 16px 48px 0 rgba(230,164,0,0.40)',
                'basalt-md':   '0 4px 24px 0 rgba(11,42,74,0.10)',
                'basalt-lg':   '0 8px 48px 0 rgba(11,42,74,0.15)',
                'basalt-xl':   '0 16px 64px 0 rgba(11,42,74,0.20)',
                'card':        '0 1px 3px rgba(11,42,74,0.08), 0 4px 16px rgba(11,42,74,0.05)',
                'card-hover':  '0 4px 20px rgba(11,42,74,0.13), 0 0 0 1px rgba(47,93,138,0.16)',
                'card-accent': '0 4px 20px rgba(11,42,74,0.12), -3px 0 0 #2F5D8A',
                'amber-sm':    '0 2px 8px 0 rgba(230,164,0,0.20)',
                'amber-md':    '0 4px 18px 0 rgba(230,164,0,0.28)',
                'amber-lg':    '0 8px 32px 0 rgba(230,164,0,0.34)',
                'amber-xl':    '0 16px 48px 0 rgba(230,164,0,0.40)',
                'inner-amber': 'inset 0 1px 0 rgba(230,164,0,0.12)',
                'focus-ring':  '0 0 0 3px rgba(47,93,138,0.28)',
                'focus-ring-amber': '0 0 0 3px rgba(230,164,0,0.35)',
                'metric':      '0 2px 8px rgba(11,42,74,0.07)',
                'nav':         '0 2px 16px rgba(11,42,74,0.22)',
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
                    from: { boxShadow: '0 0 10px rgba(47,93,138,0.16)' },
                    to:   { boxShadow: '0 0 24px rgba(47,93,138,0.34), 0 0 48px rgba(47,93,138,0.12)' },
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
                    '50%':      { opacity: '0.82', transform: 'scale(1.03)' },
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
                'basalt-grain':   "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E\")",
                'dhaka-pattern':  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232F5D8A' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                'umber-pattern':  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232F5D8A' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                'golden-radial':  'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(47,93,138,0.08) 0%, rgba(47,93,138,0.02) 55%, transparent 80%)',
                'amber-radial':   'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(11,42,74,0.05) 0%, transparent 70%)',
                'basalt-sweep':   'linear-gradient(135deg, #0B2A4A 0%, #1A3F64 40%, #2F5D8A 60%, #0B2A4A 100%)',
                'golden-shimmer': 'linear-gradient(90deg, #1E4268 0%, #2F5D8A 30%, #E6A400 50%, #2F5D8A 70%, #1E4268 100%)',
                'umber-gradient': 'linear-gradient(135deg, #0B2A4A 0%, #2F5D8A 50%, #0B2A4A 100%)',
            },
        },
    },
    plugins: [],
};
