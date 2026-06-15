import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/**/*.tsx"],
      exclude: [
        "app/**/page.tsx",
        "app/**/layout.tsx",
        "app/api/**",
        "app/**/opengraph-image.tsx",
        "app/icon.tsx",
        "app/apple-icon.tsx",
        "components/ui/**",
      ],
    },
  },
});
