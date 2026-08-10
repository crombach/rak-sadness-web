import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const DEV_PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  plugins: [react()],
  // Cloudflare Pages and `pages:deploy` both upload ./build.
  build: { outDir: "build" },
  // Fail loudly on a busy port. `pages:dev` depends on the app being on 3001.
  server: { port: DEV_PORT, strictPort: true },
  preview: { port: DEV_PORT, strictPort: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    // The suites assert on class names, never on rendered styles.
    css: false,
    // The suites were written against Create React App, which reset mocks
    // between tests. Several of them assume a clean call count.
    mockReset: true,
  },
});
