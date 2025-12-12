/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#DC2626',
          green: '#166534',
          gold: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}
