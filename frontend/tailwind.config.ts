import type { Config } from "tailwindcss";
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

const config = {
  content: [
    "./pages//*.{ts,tsx}",
    "./components//.{ts,tsx}",
    "./app/**/.{ts,tsx}",
    "./src/*/.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  
    extend: {
  
    },
  },
  plugins: [],
} satisfies Config;

export default config;
