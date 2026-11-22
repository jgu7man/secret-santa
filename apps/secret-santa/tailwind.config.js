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
        christmas: {
          red: '#DC2626',
          green: '#166534',
          gold: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
};
