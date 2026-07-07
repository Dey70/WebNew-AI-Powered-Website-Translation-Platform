/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Matches public/styles/style.css's homepage palette exactly.
        brand: {
          black: "#000000",
          dark: "#1a1a1a",
          charcoal: "#2d2d2d",
          red: {
            900: "#940d0d",
            700: "#b31010",
            600: "#d41313",
            500: "#eb2525",
            400: "#ff4444",
            300: "#ff6666",
          },
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)",
        "brand-cta": "linear-gradient(45deg, #940d0d, #b31010)",
        "brand-cta-hover": "linear-gradient(45deg, #b31010, #d41313)",
        "brand-accent": "linear-gradient(45deg, #eb2525, #ff4444)",
        "brand-accent-hover": "linear-gradient(45deg, #ff4444, #ff6666)",
      },
    },
  },
  plugins: [],
};
