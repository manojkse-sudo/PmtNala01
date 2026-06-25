import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B1F5C",
          foreground: "#FFFFFF",
          50: "#f0ebf7",
          100: "#d9ceec",
          200: "#b39dd9",
          300: "#8d6cc6",
          400: "#6640b3",
          500: "#3B1F5C",
          600: "#2e1847",
          700: "#231233",
          800: "#170b21",
          900: "#0b0510",
        },
        secondary: {
          DEFAULT: "#00B8A9",
          foreground: "#FFFFFF",
          50: "#e0f7f5",
          100: "#b3ece7",
          200: "#80dfd8",
          300: "#4dd2c8",
          400: "#26c8bb",
          500: "#00B8A9",
          600: "#009e91",
          700: "#008479",
          800: "#006a61",
          900: "#004f48",
        },
        accent: {
          DEFAULT: "#B8A1E3",
          foreground: "#3B1F5C",
          50: "#f5f1fb",
          100: "#e8dff5",
          200: "#d0bfeb",
          300: "#B8A1E3",
          400: "#9f80d9",
          500: "#8660cf",
          600: "#6d3fc5",
          700: "#5a2fa8",
          800: "#471f8a",
          900: "#34116d",
        },
        background: "#FCFCFD",
        surface: "#FFFFFF",
        border: "#E4E6EB",
        muted: {
          DEFAULT: "#F4F5F7",
          foreground: "#6B7280",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        sm: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        card: "0 0 0 1px #E4E6EB, 0 2px 4px rgba(0,0,0,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
