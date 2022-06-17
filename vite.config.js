import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  root: "src",
  base: "/RAS-PT",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      external: resolve(__dirname, "src"),
      input: {
        main: resolve(__dirname, "src/index.html"),
        bus_stops: resolve(__dirname, "src/bus_stops/index.html"),
      },
    },
  },
});
