import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: ["client/**", "build/**", "node_modules/**"] },
  {
    files: ["server/**/*.ts", "tests/**/*.ts"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: tsPlugin.configs.recommended.rules,
  },
  { files: ["server/seeder.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
];
