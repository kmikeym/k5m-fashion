import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        cream: '#FAF7F2',
        ink: '#1A1A1A',
        smoke: '#6B6B6B',
        blush: '#E8DDD3',
        hot: '#D4503A',
        not: '#8B9DAF',
        gold: '#C4A265',
      },
    },
  },
  plugins: [],
};

export default config;
