/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}" 
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8",
        secondary: "#2563EB"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    },
  },
  plugins: [],
}
