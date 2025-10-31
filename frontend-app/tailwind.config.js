/** @type {import('tailwindcss').Config} */
export default {
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
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        play: ["Play", "sans-serif"],
      },
    },
  },
  plugins: [],
}
