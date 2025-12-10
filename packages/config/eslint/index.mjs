import eslintConfigPrettier from "eslint-config-prettier";

/**
 * Base ESLint configuration for all packages
 * @type {import('eslint').Linter.Config[]}
 */
export const baseConfig = [
  eslintConfigPrettier,
  {
    ignores: ["node_modules/**", "dist/**", ".next/**", ".turbo/**"],
  },
];

/**
 * React library ESLint configuration
 * Use this for shared packages with React components
 * @type {import('eslint').Linter.Config[]}
 */
export const reactLibraryConfig = [
  ...baseConfig,
  {
    rules: {
      // Add React-specific rules here
    },
  },
];

export default baseConfig;
