import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

const config = [
  eslint.configs.recommended,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"]
  }
];

export default config;
