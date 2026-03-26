import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ['"Helvetica Neue"', 'Helvetica', '-apple-system', 'BlinkMacSystemFont', 'Arial', 'sans-serif'],
      },
      colors: {
        ink: '#0d0d0d',
        line: 'rgba(13, 13, 13, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
