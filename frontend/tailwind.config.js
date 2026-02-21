/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
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
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                heading: ['Outfit', 'Inter', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slideUp 0.6s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    from: { boxShadow: '0 0 10px rgba(220, 20, 60, 0.2)' },
                    to: { boxShadow: '0 0 20px rgba(220, 20, 60, 0.4)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(30px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
            },
            backgroundImage: {
                'dhaka-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23DC143C' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            },
        },
    },
    plugins: [],
};
