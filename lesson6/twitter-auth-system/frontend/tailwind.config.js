/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        twitter: {
          blue: '#1DA1F2',
          darkblue: '#0d8bd9',
          lightblue: '#e8f5fd',
          dark: '#14171a',
          gray: '#657786',
          lightgray: '#aab8c2',
          extralightgray: '#e1e8ed'
        }
      }
    },
  },
  plugins: [],
}
