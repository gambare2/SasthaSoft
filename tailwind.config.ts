import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/permissions/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        turquoise: {
          DEFAULT: "#55C5D2",
          light: "#79D2DC",
          dark: "#3FAAB7",
        },
        mint: {
          DEFAULT: "#EDF7F5",
          light: "#F7FBFA",
          dark: "#D5ECE7",
        },
        navy: {
          DEFAULT: "#202F3F",
          light: "#2C4055",
          dark: "#16222E",
          850: "#1E2C3B",
          900: "#141D27",
        },
        teal: {
          DEFAULT: "#11877E",
          hover: "#0D6E66",
          light: "#17A096",
        },
        "pale-cyan": {
          DEFAULT: "#D7F1F2",
          light: "#EAF8F8",
          dark: "#B8E5E7",
        },
        palecyan: "#D7F1F2",
        workspace: "#FFFFFF",
        surface: "#FFFFFF",
        border: {
          DEFAULT: "#E5E9EB",
          light: "#EEF1F2",
        },
        "text-primary": "#202124",
        "text-secondary": "#737B83",
        success: "#11877E",
        warning: "#E9A23B",
        danger: "#DC5555",
        primary: {
          DEFAULT: "#11877E", // Nexus active action is teal/turquoise
          500: "#11877E",
          600: "#0D6E66",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        panel: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [],
};
export default config;
