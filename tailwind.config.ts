import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wa: {
          primary: "#008069",
          "primary-dark": "#075e54",
          teal: "#128c7e",
          green: "#25d366",
          "bubble-out": "#d9fdd3",
          "bubble-in": "#ffffff",
          "bg-chat": "#efeae2",
          "bg-panel": "#f0f2f5",
          "text-primary": "#111b21",
          "text-secondary": "#667781",
          "dark-bg": "#0c1317",
          "dark-panel": "#111b21",
          "dark-chat": "#0b141a",
          "dark-bubble-out": "#005c4b",
          "dark-bubble-in": "#202c33",
          "dark-text": "#e9edef",
          "dark-muted": "#8696a0",
        },
      },
    },
  },
  plugins: [],
};

export default config;

