/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      maxWidth: {
        app: 'var(--app-content-max)',
      },
      colors: {
        cream: '#f1f3e6',
        'warm-white': '#faf9f4',
        clay: '#9d785b',
        sage: '#a4ac83',
        bark: '#514343',
        earth: '#838472',
        moss: '#6d7c5e',
        terracotta: '#b86b4f',
        celadon: '#d7ecdd',
        'card-border': '#d1c3a0',
        'card-dark': '#3d2e2e',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        warm: '0 4px 20px rgba(81, 67, 67, 0.10), 0 1px 4px rgba(81, 67, 67, 0.06)',
        'warm-lg': '0 12px 40px rgba(81, 67, 67, 0.14), 0 2px 8px rgba(81, 67, 67, 0.08)',
        'warm-xl': '0 24px 60px rgba(81, 67, 67, 0.18)',
      },
      animation: {
        'stamp-pop': 'stampPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.25s ease',
        'bounce-sm': 'bounceSm 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        stampPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.12)' },
          '70%': { transform: 'scale(0.96)' },
        },
      },
    },
  },
  plugins: [],
};
