/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F4',
        surface: '#F4EFE9',
        surface2: '#EDE5DC',
        ink: '#2A1F2D',
        ink2: '#4A3850',
        muted: '#7A6880',
        rose: {
          light: '#F7D6E3',
          DEFAULT: '#E8A0B4',
          deep: '#C96E8A',
          dark: '#8B3A56',
        },
        blush: '#F9ECF1',
        lavender: {
          light: '#EDE8F6',
          DEFAULT: '#D4C8E8',
          deep: '#8B72C8',
        },
        sage: {
          light: '#DCF0E2',
          DEFAULT: '#A8C4B0',
          deep: '#5A8C6A',
        },
        gold: {
          light: '#FAF0DC',
          DEFAULT: '#D4A84B',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
