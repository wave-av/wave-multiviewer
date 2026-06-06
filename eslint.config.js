// eslint.config.js — flat config (ESLint 9)
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
  { ignores: ['out/**', 'release/**', 'dist/**', 'node_modules/**', '*.config.js', '*.config.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { plugins: { 'react-hooks': reactHooks }, rules: reactHooks.configs.recommended.rules },
  { files: ['**/*.{ts,tsx}'], languageOptions: { parserOptions: { projectService: false } } },
);
