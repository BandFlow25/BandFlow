import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

//TODO: Turn this back on and fix issues
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // Disable warnings for unused variables
      "@typescript-eslint/no-empty-object-type": "off", // Suppress empty object type errors
      "@typescript-eslint/no-explicit-any": "off", // Disable explicit `any` warnings
      "react/no-unescaped-entities": "off", // Disable unescaped character warnings
      "@next/next/no-img-element": "off", // Suppress `<img>` element warnings
    },
  },
];


export default eslintConfig;
