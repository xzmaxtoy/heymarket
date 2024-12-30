/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/public/**/*.{html,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
