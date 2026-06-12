/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0b4f9c",
          dark: "#073a73",
          light: "#2e7bd6",
          gold: "#d4af37",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
