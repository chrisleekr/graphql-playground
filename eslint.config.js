import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // Global ignores
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/.next/',
    '**/.turbo/',
    '**/generated/',
    '**/coverage/',
  ]),

  // Base JavaScript config
  {
    name: 'base/js',
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
  },

  // TypeScript config for all TS files
  {
    name: 'base/typescript',
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Next.js / React frontend
  {
    name: 'apps/web',
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    rules: {
      // React-specific rules (basic, without plugin)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // NestJS API backend
  {
    name: 'apps/api',
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off', // Allow console in backend
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  // Shared packages
  {
    name: 'packages/shared',
    files: ['packages/shared/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Database package
  {
    name: 'packages/database',
    files: ['packages/database/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
