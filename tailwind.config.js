/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#121a26",
        secondary: "#1a2533",
        accent: "#0a66c2",
        textLight: "#e5e7eb",
        linkHover: "#d1d5db",
        borderDark: "#1f2937",
      },
    },
  },
  plugins: [],
};
