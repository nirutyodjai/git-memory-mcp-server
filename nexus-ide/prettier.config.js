/**
 * Prettier Configuration for NEXUS IDE
 * 
 * This configuration ensures consistent code formatting across the entire project.
 * It follows modern JavaScript/TypeScript best practices and integrates well with ESLint.
 */

export default {
  // Basic formatting options
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // JSX specific options
  jsxSingleQuote: true,
  
  // Trailing commas
  trailingComma: 'es5',
  
  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow function parentheses
  arrowParens: 'avoid',
  
  // Range formatting
  rangeStart: 0,
  rangeEnd: Infinity,
  
  // Parser options
  requirePragma: false,
  insertPragma: false,
  
  // Prose wrapping
  proseWrap: 'preserve',
  
  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',
  
  // Vue files
  vueIndentScriptAndStyle: false,
  
  // Line endings
  endOfLine: 'lf',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Single attribute per line in HTML, Vue and JSX
  singleAttributePerLine: false,
  
  // Plugin-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.css',
      options: {
        printWidth: 120,
        singleQuote: false
      }
    },
    {
      files: '*.scss',
      options: {
        printWidth: 120,
        singleQuote: false
      }
    },
    {
      files: '*.less',
      options: {
        printWidth: 120,
        singleQuote: false
      }
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        tabWidth: 2,
        htmlWhitespaceSensitivity: 'ignore'
      }
    },
    {
      files: '*.svg',
      options: {
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore'
      }
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel'
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript'
      }
    },
    {
      files: '*.vue',
      options: {
        parser: 'vue'
      }
    },
    {
      files: '*.graphql',
      options: {
        parser: 'graphql'
      }
    },
    {
      files: '*.gql',
      options: {
        parser: 'graphql'
      }
    },
    {
      files: 'package.json',
      options: {
        tabWidth: 2,
        printWidth: 120
      }
    },
    {
      files: 'package-lock.json',
      options: {
        tabWidth: 2,
        printWidth: 1000
      }
    },
    {
      files: 'yarn.lock',
      options: {
        tabWidth: 2,
        printWidth: 1000
      }
    },
    {
      files: 'pnpm-lock.yaml',
      options: {
        tabWidth: 2,
        printWidth: 1000
      }
    },
    {
      files: '*.config.js',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '*.config.ts',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: 'tailwind.config.*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: 'vite.config.*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: 'vitest.config.*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: 'playwright.config.*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '.storybook/**/*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '**/*.stories.*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '**/*.test.*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '**/*.spec.*',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    }
  ]
};