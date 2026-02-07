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
        // Backgrounds (exact from HL HTML source)
        bg: "#04251F",       // rgb(4, 37, 31) green-tinted page bg
        s1: "#0F1A1F",       // rgb(15, 26, 31) card/nav bg
        s2: "#1a2a28",       // hover states, slightly lighter
        s3: "#243432",       // active states
        s4: "#2e3e3c",       // pressed states
        s5: "#384846",       // elevated surfaces
        card: "#0F1A1F",     // same as s1, card bg
        // Borders
        brd: "#303030",      // rgb(48, 48, 48) exact from HL HTML
        brd2: "#404040",     // secondary border
        // Text
        t1: "#F6FEFD",       // rgb(246, 254, 253) slightly green-white
        t2: "#949E9C",       // rgb(148, 158, 156) secondary text
        t3: "#878C8F",       // rgb(135, 140, 143) label text
        t4: "#5a6260",       // disabled text
        // Accent
        acc: "#00d8c4",      // teal accent
        grn: "#23b879",      // soft green
        red: "#e54d69",      // soft red
        blu: "#0066ff",      // blue accent
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "Ubuntu", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
