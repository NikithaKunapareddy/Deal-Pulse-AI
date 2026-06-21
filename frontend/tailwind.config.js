/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0a0015',
        'dark-secondary': '#1a1a2e',
        purple: '#7c3aed',
        'purple-light': '#c084fc',
      },
    },
  },
  plugins: [],
}
