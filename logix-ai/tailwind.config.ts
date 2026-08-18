import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand palette — premium logistics-tech identity
        navy: {
          50: "#eef2f8",
          100: "#d6e0ee",
          200: "#adc1dd",
          300: "#7f9dc9",
          400: "#4d6fa3",
          500: "#2c4a7c",
          600: "#1c3560",
          700: "#13274a",
          800: "#0c1b36",
          900: "#060f20",
          950: "#03080f",
        },
        skyline: {
          50: "#eef8ff",
          100: "#d9eeff",
          200: "#b9e0ff",
          300: "#87ccff",
          400: "#4eb0ff",
          500: "#2590fa",
          600: "#1370df",
          700: "#0f59b4",
          800: "#134b92",
          900: "#154176",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f5f7fa",
          border: "#e3e8ef",
        },
        neutral: {
          50: "#f8f9fb",
          100: "#eef0f3",
          200: "#dde1e7",
          300: "#c2c9d2",
          400: "#96a0ad",
          500: "#6b7482",
          600: "#4d5561",
          700: "#374049",
          800: "#232830",
          900: "#14171c",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(12, 27, 54, 0.06), 0 8px 24px rgba(12, 27, 54, 0.06)",
        card: "0 2px 8px rgba(12, 27, 54, 0.08), 0 12px 32px rgba(12, 27, 54, 0.08)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "route-flow": "routeFlow 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        routeFlow: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
