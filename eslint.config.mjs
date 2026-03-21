import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import securityPlugin from 'eslint-plugin-security';

// ── Shared TypeScript settings ────────────────────────────────────
const typescriptLanguageOptions = {
  parser: typescriptParser,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
};

// ── Shared TypeScript rules ───────────────────────────────────────
const typescriptRules = {
  '@typescript-eslint/ban-ts-comment': 'error',
  '@typescript-eslint/no-duplicate-enum-values': 'error',
  '@typescript-eslint/no-empty-object-type': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-extra-non-null-assertion': 'error',
  '@typescript-eslint/no-misused-new': 'error',
  '@typescript-eslint/no-namespace': 'error',
  '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
  '@typescript-eslint/no-require-imports': 'error',
  '@typescript-eslint/no-this-alias': 'error',
  '@typescript-eslint/no-unnecessary-type-constraint': 'error',
  '@typescript-eslint/no-unsafe-declaration-merging': 'error',
  '@typescript-eslint/no-unsafe-function-type': 'error',
  '@typescript-eslint/no-unused-expressions': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/no-wrapper-object-types': 'error',
  '@typescript-eslint/prefer-as-const': 'error',
  '@typescript-eslint/triple-slash-reference': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
};

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  // ── Global ignores ──────────────────────────────────────────────
  {
    ignores: [
      'node_modules/',
      '.next/',
      'storybook-static/',
      'coverage/',
      'prisma/',
      'dist/',
      '*.config.mjs',
      'next-env.d.ts',
    ],
  },

  // ── App source code (src/**) ────────────────────────────────────
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: typescriptLanguageOptions,
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      '@next/next': nextPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      security: securityPlugin,
    },
    rules: {
      // Next.js core-web-vitals
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // React Hooks
      ...reactHooksPlugin.configs.recommended.rules,

      // JSX Accessibility (recommended)
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',

      // Security (recommended)
      ...securityPlugin.configs.recommended.rules,
      'security/detect-object-injection': 'off',

      // TypeScript
      ...typescriptRules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@next/next/no-assign-module-variable': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // ── Test files (tests/**, src/**/*.test.*) ──────────────────────
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    languageOptions: typescriptLanguageOptions,
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      security: securityPlugin,
    },
    rules: {
      ...typescriptRules,
      ...securityPlugin.configs.recommended.rules,
      'security/detect-object-injection': 'off',
      // Relaxed rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-console': 'off',
    },
  },
];

export default eslintConfig;
