// Imported from 'vitest/config' (not 'vite') so the `test` field below type-checks.
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
  server: {
    // Bind to plain localhost: Windows can't resolve *.localhost subdomains for
    // programs (browsers resolve them internally, Node does not), so binding to
    // "admin.localhost" fails with ENOTFOUND. The dev proxy reaches us on
    // localhost:5174 and the admin.localhost name is handled in the browser.
    // 5173 belongs to the dev proxy, which routes admin.localhost:5173 here.
    // Sharing that port makes the two race for it and the proxy 502s.
    port: 5174,
    allowedHosts: ["localhost", "admin.localhost", "api.localhost"],
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
