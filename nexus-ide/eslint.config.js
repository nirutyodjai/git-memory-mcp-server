import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    ignores: [
      'dist',
      'build',
      'coverage',
      'node_modules',
      '*.min.js',
      'public',
      '.next',
      '.nuxt',
      '.vuepress/dist',
      'storybook-static',
      'playwright-report',
      'test-results',
      '.nexus',
      '.nexus-cache',
      '.nexus-temp',
      '.nexus-logs',
      'ai-models',
      'model-cache',
      'mcp-data',
      'mcp-cache',
      'mcp-logs'
    ]
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json'
      },
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.node
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': typescript,
      prettier,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      security,
      sonarjs
    },
    rules: {
      // JavaScript/TypeScript Core Rules
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      
      // React Rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      
      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      
      // TypeScript Specific
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false
        }
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      
      // React Specific
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-no-useless-fragment': 'error',
      
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Import/Export Rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type'
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      'import/no-unresolved': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-duplicate-imports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-anonymous-default-export': 'warn',
      
      // Accessibility Rules
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      
      // Security Rules
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      
      // SonarJS Rules (Code Quality)
      ...sonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/max-switch-cases': ['error', 30],
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-duplicate-string': ['error', 3],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-inverted-boolean-check': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-same-line-conditional': 'error',
      'sonarjs/no-small-switch': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/prefer-while': 'error',
      
      // General Code Quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: true,
          object: true
        },
        {
          enforceForRenamedProperties: false
        }
      ],
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'prefer-object-spread': 'error',
      'prefer-spread': 'error',
      'prefer-rest-params': 'error',
      'array-callback-return': 'error',
      'consistent-return': 'error',
      'default-case': 'error',
      'default-case-last': 'error',
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-return-await': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'radix': 'error',
      'yoda': 'error',
      
      // Prettier Integration
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto'
        }
      ]
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    }
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      // Test files can be more lenient
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'no-console': 'off'
    }
  },
  {
    files: ['**/*.config.{js,ts}', '**/vite.config.{js,ts}', '**/tailwind.config.{js,ts}'],
    rules: {
      // Config files can use require and have different patterns
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-anonymous-default-export': 'off'
    }
  },
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}'],
    rules: {
      // Storybook files
      'import/no-anonymous-default-export': 'off',
      'react-hooks/rules-of-hooks': 'off'
    }
  }
];