/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blue: {
          500: '#1DA1F2', // Twitter blue
        },
      },
      animation: {
        'heart-burst': 'heart-burst 0.8s steps(28) forwards',
      },
      keyframes: {
        'heart-burst': {
          from: { 'background-position': 'left' },
          to: { 'background-position': 'right' }
        }
      },
    },
  },
  plugins: [],
};