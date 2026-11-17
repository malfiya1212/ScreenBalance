/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Strict Design System: No pure white (#FFFFFF) or pure black (#000000)
        sand: {
          light: '#FAFAF7',
          DEFAULT: '#F4F4F0',
          dark: '#E5E5DE',
        },
        obsidian: {
          light: '#252528',
          DEFAULT: '#141416',
          dark: '#0E0E10',
        },
        surface: {
          base: '#EBEBE6',
          paper: '#F7F7F4',
          elevated: '#FAFAF7',
        },
        text: {
          obsidian: '#141416',
          stone: '#6B7280',
          sand: '#F4F4F0',
        },
        stone: {
          light: '#9CA3AF',
          DEFAULT: '#6B7280',
          dark: '#4B5563',
        },
        danger: {
          base: '#FDF2F2',
          border: '#DC2626',
          text: '#991B1B',
        },
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #141416',
        'brutal-sm': '2px 2px 0px 0px #141416',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      },
      borderRadius: {
        'md': '6px',
        'lg': '8px',
      }
    },
  },
  plugins: [],
};
