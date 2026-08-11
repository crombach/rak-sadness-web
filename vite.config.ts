import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const DEV_PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  plugins: [react()],
  build: {
    // The Cloudflare Pages build serves ./build, and `pages:dev` serves it locally.
    outDir: "build",
    // Above the `xlsx-js-style` chunk, which is large on purpose and fetched only
    // when a workbook is read or written. Low enough to still complain if the
    // chunk the app loads up front grows towards it.
    chunkSizeWarningLimit: 900,
  },
  // Fail loudly on a busy port rather than sliding to the next one.
  server: { port: DEV_PORT, strictPort: true },
  preview: { port: DEV_PORT, strictPort: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    // The suites assert on class names, never on rendered styles.
    css: false,
    // Several suites assume a clean call count per test.
    mockReset: true,
    // Above the 5s a single `findBy` is now allowed to wait, so a slow wait fails
    // on its own assertion rather than on the test running out of time.
    testTimeout: 15000,
  },
});
