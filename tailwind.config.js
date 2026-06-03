/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amex: {
          blue: "#006fcf",
          dark: "#00175a",
        },
      },
    },
  },
  plugins: [],
};
