/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twitter: {
          blue: '#1DA1F2',
          darkBlue: '#1976D2',
          lightGray: '#F7F9FA',
          darkGray: '#657786',
          black: '#14171A'
        }
      }
    },
  },
  plugins: [],
}
