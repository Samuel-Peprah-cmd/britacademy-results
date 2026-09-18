/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brit: {
          navy: '#1a2942',
          red: '#8b262a',
          gold: '#cba052',
        }
      }
    }
  },
  plugins: [],
}