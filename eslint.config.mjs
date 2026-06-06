import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/js/**",
      // Vendored third-party type declarations.
      "typings/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // The OpenCV worker and OCR hook intentionally log progress.
      "no-console": "off",
      // The OpenCV/worker messaging code is loosely typed by nature.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
