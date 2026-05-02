import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary green palette
        green: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Accent earth tones
        earth: {
          50:  '#fdf8f0',
          100: '#faefd8',
          200: '#f4dba8',
          300: '#ecc06e',
          400: '#e4a03a',
          500: '#d4851e',
          600: '#b86815',
          700: '#964f14',
          800: '#7a4017',
          900: '#643617',
        },
        // Sky blue for weather
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Brand colors
        brand: {
          primary:   '#16a34a',
          secondary: '#d4851e',
          accent:    '#0ea5e9',
          dark:      '#052e16',
          light:     '#f0fdf4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-green': 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #052e16 100%)',
        'gradient-earth': 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        'gradient-hero':  'linear-gradient(135deg, #052e16 0%, #14532d 40%, #166534 70%, #16a34a 100%)',
        'gradient-card':  'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      boxShadow: {
        'green-sm': '0 1px 3px rgba(22, 163, 74, 0.2)',
        'green-md': '0 4px 12px rgba(22, 163, 74, 0.25)',
        'green-lg': '0 10px 30px rgba(22, 163, 74, 0.3)',
        'card':     '0 2px 15px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-in-out',
        'slide-up':     'slideUp 0.5s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'bounce-slow':  'bounce 3s infinite',
        'pulse-green':  'pulseGreen 2s infinite',
        'float':        'float 6s ease-in-out infinite',
        'grow':         'grow 1s ease-out',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(22, 163, 74, 0.4)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(22, 163, 74, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        grow: {
          '0%':   { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
