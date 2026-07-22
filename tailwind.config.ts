import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── POSTECH brand palette ───────────────────────────────
        // POSTECH Red   PANTONE 215C  RGB(166, 25, 85)  #A61955  (primary)
        // POSTECH Orange PANTONE 130C RGB(246, 167, 0)  #F6A700  (accent/강조)
        // POSTECH Gray  PANTONE 404C  RGB(122, 119, 114) #7A7772 (neutral)
        brand: {
          50: "#fbecf2",
          100: "#f7d6e2",
          200: "#eeadc4",
          300: "#e07fa1",
          400: "#cd527d",
          500: "#b93063",
          600: "#a61955",
          700: "#891247",
          800: "#6d0f3a",
          900: "#5b0d31",
        },
        accent: {
          50: "#fff7e6",
          100: "#ffe9bf",
          200: "#ffd985",
          300: "#fcc74c",
          400: "#f9b71f",
          500: "#f6a700",
          600: "#d38e00",
          700: "#a66f00",
          800: "#7f5600",
          900: "#663f00",
        },
        pgray: {
          50: "#f6f5f4",
          100: "#eae8e7",
          200: "#d5d2d0",
          300: "#bab6b2",
          400: "#979490",
          500: "#7a7772",
          600: "#666360",
          700: "#524f4c",
          800: "#3d3b39",
          900: "#2a2827",
        },
      },
      fontFamily: {
        sans: ['"Gothic A1"', "ui-sans-serif", "system-ui", '"Apple SD Gothic Neo"', '"Malgun Gothic"', "sans-serif"],
        display: ['"Jua"', '"Gothic A1"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
