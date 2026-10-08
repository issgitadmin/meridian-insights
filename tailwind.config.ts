import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#060607", // page
          900: "#0e0e10", // shell
          850: "#141416", // card
          800: "#1b1b1e", // raised / input
          700: "#26262a", // border
          600: "#34343a", // border strong
        },
        fg: {
          DEFAULT: "#f4f4f5",
          muted: "#a1a1aa",
          subtle: "#71717a",
        },
        // Chart palette, validated for the dark surface (blue, orange, aqua, yellow, violet)
        viz: {
          blue: "#3987e5",
          orange: "#d95926",
          aqua: "#199e70",
          yellow: "#c98500",
          violet: "#8b6fe0",
        },
        accent: "#5b8def",
        good: "#22c55e",
        bad: "#ef4444",
        warn: "#f59e0b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
