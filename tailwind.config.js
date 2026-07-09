/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        ecar: {
          blue: '#0B2240',      // Corporate Navy Blue
          blueDark: '#07162A',
          blueLight: '#E5E8EC',
          blueMuted: '#1A3F70',
          red: '#D22027',       // Corporate Red
          redDark: '#A6191E',
          redLight: '#FBE8E9',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F4F6F8', // Very light corporate gray
          tertiary: '#EAECEF',
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(0,0,0,0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.015) 1px, transparent 1px)'
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'slide-in-right': 'slideInRight 0.25s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'stagger-1': 'fadeInUp 0.3s ease-out 0.03s forwards',
        'stagger-2': 'fadeInUp 0.3s ease-out 0.06s forwards',
        'stagger-3': 'fadeInUp 0.3s ease-out 0.09s forwards',
        'stagger-4': 'fadeInUp 0.3s ease-out 0.12s forwards',
        'stagger-5': 'fadeInUp 0.3s ease-out 0.15s forwards',
        'stagger-6': 'fadeInUp 0.3s ease-out 0.18s forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
}
