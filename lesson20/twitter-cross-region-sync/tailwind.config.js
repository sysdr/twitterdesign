/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'twitter-blue': '#1DA1F2',
        'twitter-dark': '#14171A',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
