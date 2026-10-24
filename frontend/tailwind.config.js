/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FCFBF9',
          100: '#FAF9F6',
          200: '#F5F3EF',
          300: '#ECE8DF',
        },
        plum: {
          50: '#FAF5FB',
          100: '#F4E8F6',
          200: '#E9D1EE',
          500: '#862D88',
          600: '#6B21A8',
          700: '#581C87',
          800: '#4A154B',
          900: '#380E39',
        },
        gold: {
          400: '#FBBF24',
          500: '#D4AF37',
          600: '#B89726',
        },
        rose: {
          400: '#FB7185',
          500: '#D9777F',
          600: '#E11D48',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
};
