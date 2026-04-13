/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Bebas Neue', 'sans-serif'],
      },
      colors: {
        'orange-primary': '#F36B1F',
        'orange-hover': '#E05E15',
        'orange-light': '#FEF0E7',
        'orange-tint': '#F5F3F0',
        'green-positive': '#2E7D32',
        'red-negative': '#C62828',
        'blue-info': '#1565C0',
        'page': '#F7F6F4',
        'card': '#FFFFFF',
        'text-primary': '#3B3B3B',
        'text-secondary': '#5A5A5A',
      },
      borderRadius: {
        'card': '14px',
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'bar-expand': 'barExpand 1s ease-out forwards',
        'dot-pop': 'dotPop 0.3s ease-out forwards',
        'panel-fade-in': 'panelFadeIn 0.3s ease-out forwards',
      },
      animationDelay: {
        '0': '0ms',
        '1': '80ms',
        '2': '160ms',
        '3': '240ms',
      },
    },
  },
  plugins: [],
}
