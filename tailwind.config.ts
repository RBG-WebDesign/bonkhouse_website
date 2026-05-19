import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f7f4ea",
        paper: "#050505",
        butter: "#ffd400",
        cherry: "#ff4d2e",
        blue: "#7b8794",
        sage: "#9ca37d",
        night: "#000000"
      },
      fontFamily: {
        display: ["Arial Black", "Trebuchet MS", "sans-serif"],
        hand: ["Bradley Hand ITC", "Segoe Print", "Comic Sans MS", "cursive"],
        serif: ["Georgia", "Cambria", "serif"],
        sans: ["Trebuchet MS", "Verdana", "sans-serif"]
      },
      boxShadow: {
        sticker: "0 0 0 1px rgba(255, 212, 0, 0.35), 0 18px 48px rgba(0, 0, 0, 0.45)",
        soft: "0 22px 70px rgba(0, 0, 0, 0.5)"
      }
    }
  },
  plugins: []
};

export default config;
