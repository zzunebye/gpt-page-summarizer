/** @type {import('tailwindcss').Config} */
export default {
  purge: ['./index.html', './src/**/*.{ts,tsx}', './src/*.{ts,tsx}'],
  darkMode: false,
  content: [],
  theme: {
    extend: {
      spacing: {
        '128': '32rem',
      }
    },
  },
  plugins: [],
  variants: {},
}