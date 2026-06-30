import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        shadow: {
          bg: "#0D0D11",
          panel: "#14141C",
          purple: "#8A2BE2",
          cyan: "#00FFFF",
          silver: "#C0C8D8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        purple: "0 0 32px rgba(138, 43, 226, 0.45)",
        cyan: "0 0 24px rgba(0, 255, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
