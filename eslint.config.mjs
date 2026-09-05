import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: nextTypescript,
  },
  globalIgnores([
    ".netlify/**",
    "coverage/**",
    "output/**",
    // Generated design-canvas runtime.
    "public/support.js",
  ]),
]);
