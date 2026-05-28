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
        /* "ink" is the foreground mark. The Instrument inverts the ground to
           near-black, so ink is now off-white and line is a faint off-white hairline. */
        ground: '#0d0d0d',
        ink: '#f4f4f2',
        line: 'rgba(244, 244, 242, 0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
