// @ts-check
import eslint from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { qualityRules, testFileRuleOverrides } from './eslint-rules/quality.mjs';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/public/**',
      '**/.turbo/**',
      '**/coverage/**',
      'apps/server/generated/**',
      'apps/server/scripts/**',
      '**/*.mjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      jsdoc,
    },
    rules: qualityRules,
    settings: {
      jsdoc: {
        mode: 'typescript',
      },
    },
  },
  {
    files: ['apps/server/**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: './apps/server/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['apps/client/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ['./apps/client/tsconfig.app.json', './apps/client/tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: [
      '**/*.{spec,test}.{ts,tsx}',
      'apps/server/test/**/*.ts',
    ],
    rules: testFileRuleOverrides,
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      ...testFileRuleOverrides,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
