/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'emerald-deep': '#0f4c3a',
        'gold-luxe': '#d4af37',
      }
    },
  },
  plugins: [],
}
