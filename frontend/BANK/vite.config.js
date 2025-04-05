import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3001, // <-- changed to 3001
  },
});
// https://vitejs.dev/config/
// https://vitejs.dev/guide/features.html#hot-module-replacement
// https://vitejs.dev/guide/features.html#server-hot-module-replacement
