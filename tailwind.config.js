/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ink: '#0d0f14',
        paper: '#f5f3ee',
        slate: '#1e2330',
        muted: '#6b7280',
        accent: '#e85d2b',
        safe: '#2d9b6f',
        warn: '#e8852b',
        danger: '#c93030',
        highlight: '#f0c040',
      },
    },
  },
  plugins: [],
}
