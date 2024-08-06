import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        "add-game-times": resolve(__dirname, "vue/add-game-times/main.ts"),
        calendar: resolve(__dirname, "vue/calendar/main.ts"),
      },
      output: {
        assetFileNames: "[name][extname]",
        chunkFileNames: "[name].js",
        entryFileNames: "[name].js",
      },
    },
    watch: {
      include: "vue/**",
    },
  },
});
