import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Picasso, vendored by `npm run sync:picasso` until it's published.
      // Swap this alias for the real package and nothing else changes.
      "@ir/ui": path.resolve(__dirname, "./vendor/picasso/ui/index.ts"),
    },
  },
})