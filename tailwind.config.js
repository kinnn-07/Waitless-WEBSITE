/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#14213D',
        teal: '#2EC4B6',
        'deep-teal': '#0B7285',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
