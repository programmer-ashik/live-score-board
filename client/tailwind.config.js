/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) forwards',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'translateY(50px) scale(0.3)', opacity: '0' },
          '80%': { transform: 'translateY(-10px) scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}