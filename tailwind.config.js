/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg: '#060608',
        surface: '#0d0d12',
        surface2: '#13131a',
        border: '#1e1e2e',
        'border-bright': '#2a2a40',
        text: '#e8e8f0',
        muted: '#5a5a78',
        dim: '#2e2e45',
        red: '#ff3b3b',
        orange: '#ff7b1a',
        yellow: '#f5c518',
        green: '#00d68f',
        accent: '#7c5cfc',
        solana: '#9945ff',
      },
    },
  },
  plugins: [],
};
