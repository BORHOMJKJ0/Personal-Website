// ESLint for the site's source. Lives here, not at the repo root, because
// typescript-eslint needs TypeScript's JS API and the site uses TypeScript 7,
// which no longer ships one — see package.json. Rules are syntactic (no type
// information), so TypeScript 6 only has to parse; `npm run typecheck` at the
// root remains the type authority.
//
// Run from the repo root (`npm run lint`): ESLint resolves file patterns
// against the working directory when given -c.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'artifacts/**', 'scripts/**', 'public/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);
