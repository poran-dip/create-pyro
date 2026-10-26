import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  optimizeDeps: {
    // Route modules load lazily, so without this Vite discovers their deps on
    // the first page visit and force-reloads the page.
    entries: ["./app/**/*.tsx"],
  },
});
