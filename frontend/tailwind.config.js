/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#030213",
        gradientFrom: "#7B2FF7",
        gradientTo: "#F107A3",
        foreground: "oklch(0.145 0 0)",
        secondary: "oklch(0.95 0.0058 264.53)",
        muted: "#ececf0",
        accent: "#e9ebef",
        warning: "oklch(0.646 0.222 41.116)"
      },
      borderRadius: {
        xl2: "1rem"
      }
    }
  },
  plugins: []
};
