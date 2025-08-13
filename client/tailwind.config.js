/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        millipore: {
          blue: '#0066CC',
          'blue-dark': '#004499',
          'blue-light': '#3388DD',
          orange: '#FF6600',
          'orange-dark': '#CC5200',
          gray: '#666666',
          'gray-light': '#F5F5F5'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}