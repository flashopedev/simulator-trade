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
        // Backgrounds (exact Hyperliquid)
        bg: "#0a0f14",
        s1: "#0f1419",
        s2: "#151b21",
        s3: "#1c2430",
        s4: "#232d3b",
        s5: "#2a3544",
        // Borders
        brd: "#1a1f2e",
        brd2: "#2a3544",
        // Text
        t1: "#ffffff",
        t2: "#8a949e",
        t3: "#6b7280",
        t4: "#4b5563",
        // Accent
        acc: "#00d8c4",
        grn: "#00c076",
        red: "#ff4976",
        blu: "#0066ff",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
