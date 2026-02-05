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
        bg: "#000",
        s1: "#060809",
        s2: "#0d0f10",
        s3: "#141617",
        s4: "#1b1d1f",
        s5: "#222426",
        brd: "#151718",
        brd2: "#1e2022",
        t1: "#eef0f2",
        t2: "#a0a4a8",
        t3: "#686c70",
        t4: "#3e4245",
        acc: "rgb(80,210,193)",
        grn: "#22c55e",
        red: "#ef4444",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
