/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f1117',
        surface: '#1a1d24',
        primary: '#2563eb',
        success: '#22c55e',
        warning: '#fbbf24',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
