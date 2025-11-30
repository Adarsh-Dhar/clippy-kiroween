/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'win95-teal': '#008080',
        'win95-gray': '#c0c0c0',
        'win95-darkgray': '#808080',
        'win95-lightgray': '#dfdfdf',
        'win95-white': '#ffffff',
        'win95-black': '#000000',
        'win95-blue': '#000080',
        'win95-darkred': '#400000',
        'win95-cream': '#fffff0',
      },
      fontFamily: {
        'win95': ['MS Sans Serif', 'system-ui', 'sans-serif'],
        'code': ['Courier New', 'monospace'],
      },
      boxShadow: {
        'win95-out': 'inset 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #808080, 1px 1px 0 0 #dfdfdf, -1px -1px 0 0 #000000',
        'win95-in': 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff',
        'win95-field': 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf',
      },
      animation: {
        'shake': 'shake 0.2s infinite',
        'glitch': 'glitch 0.4s infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-2px, -2px)' },
          '20%': { transform: 'translate(2px, 2px)' },
          '30%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '50%': { transform: 'translate(-1px, 1px)' },
          '60%': { transform: 'translate(1px, -1px)' },
          '70%': { transform: 'translate(-2px, -1px)' },
          '80%': { transform: 'translate(2px, 1px)' },
          '90%': { transform: 'translate(0, 2px)' },
        },
        glitch: {
          '0%': { textShadow: '2px 0 #ff00ff, -2px 0 #00ffff' },
          '50%': { textShadow: '-2px 0 #ff00ff, 2px 0 #00ffff' },
          '100%': { textShadow: '2px 0 #ff00ff, -2px 0 #00ffff' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
