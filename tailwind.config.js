/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "320px",
      md: "768px",
      lg: "1024px",
      xl: "1440px",
      "2xl": "1920px",
    },
    extend: {
      colors: {
        // Identité MKA.P-MS : Noir luxe (UI principale) + Or premium (accent) sur fond blanc.
        brand: {
          DEFAULT: "#111111",
          dark: "#000000",
          light: "#4b5563",
          gold: "#d4af37",
        },
        gold: {
          DEFAULT: "#d4af37",
          dark: "#b8941f",
          soft: "#f5e7b8",
        },
        noir: "#111111",
        ink: "#1f2937",
        surface: "#f8f9fa",
        success: {
          DEFAULT: "#16a34a",
          dark: "#15803d",
        },
        info: "#2563eb",
        warning: "#f59e0b",
        danger: "#dc2626",
        whatsapp: "#25d366",
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
