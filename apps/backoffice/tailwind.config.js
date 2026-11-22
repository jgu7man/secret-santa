const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/*.{html,ts}'),
    join(__dirname, '../../libs/**/*.{html,ts}'),
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          950: '#062e25',
          900: '#093d31',
          700: '#156552',
          100: '#e4ecdc',
        },
        scarlet: {
          600: '#c6122c',
          800: '#8d0a22',
        },
      },
    },
  },
  plugins: [],
};
