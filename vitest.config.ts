import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/resumeai_test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
