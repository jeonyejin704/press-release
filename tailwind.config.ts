import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Trustworthy navy / blue / white palette per UX brief.
        brand: {
          50: "#eef4fb",
          100: "#d8e6f6",
          200: "#b3cded",
          300: "#7fa9de",
          400: "#4a80c9",
          500: "#2b60ad",
          600: "#1f4a8c",
          700: "#1a3c72",
          800: "#16305c",
          900: "#0f2744",
        },
      },
    },
  },
  plugins: [],
};

export default config;
