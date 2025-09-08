/**
 * Storybook Main Configuration for NEXUS IDE
 * 
 * This configuration sets up Storybook for component development and documentation,
 * including support for TypeScript, React, and various addons.
 */

import type { StorybookConfig } from '@storybook/react-vite';
import { resolve } from 'path';

const config: StorybookConfig = {
  // Stories configuration
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/**/*.story.@(js|jsx|ts|tsx|mdx)',
    '../docs/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../docs/**/*.story.@(js|jsx|ts|tsx|mdx)'
  ],
  
  // Addons configuration
  addons: [
    // Essential addons
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-onboarding',
    
    // Design and styling
    '@storybook/addon-styling-webpack',
    '@storybook/addon-postcss',
    
    // Documentation
    '@storybook/addon-docs',
    '@storybook/addon-mdx-gfm',
    
    // Accessibility
    '@storybook/addon-a11y',
    
    // Testing
    '@storybook/addon-jest',
    '@storybook/addon-coverage',
    
    // Design tokens
    '@storybook/addon-design-tokens',
    
    // Viewport and responsive design
    '@storybook/addon-viewport',
    
    // Controls and actions
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    
    // Background and themes
    '@storybook/addon-backgrounds',
    '@storybook/addon-themes',
    
    // Performance
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    
    // Development tools
    '@storybook/addon-toolbars',
    '@storybook/addon-console',
    
    // Visual testing
    '@storybook/addon-visual-tests',
    
    // Figma integration
    'storybook-addon-figma',
    
    // Mock service worker
    'msw-storybook-addon'
  ],
  
  // Framework configuration
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: resolve(__dirname, '../vite.config.ts')
      }
    }
  },
  
  // TypeScript configuration
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        // Filter out props from node_modules except for specific libraries
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules') ||
                 prop.parent.fileName.includes('@types/react') ||
                 prop.parent.fileName.includes('@radix-ui');
        }
        return true;
      },
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false
      }
    }
  },
  
  // Documentation configuration
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation'
  },
  
  // Features configuration
  features: {
    // Enable modern features
    storyStoreV7: true,
    argTypeTargetsV7: true,
    legacyMdx1: false,
    
    // Build optimizations
    buildStoriesJson: true,
    
    // Modern bundling
    modernInlineRender: true,
    
    // Interaction testing
    interactionsDebugger: true
  },
  
  // Static directories
  staticDirs: [
    '../public',
    '../src/assets'
  ],
  
  // Environment variables
  env: (config) => ({
    ...config,
    STORYBOOK: 'true',
    NODE_ENV: 'development'
  }),
  
  // Vite configuration
  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import('vite');
    
    return mergeConfig(config, {
      // Resolve configuration
      resolve: {
        alias: {
          '@': resolve(__dirname, '../src'),
          '@components': resolve(__dirname, '../src/components'),
          '@hooks': resolve(__dirname, '../src/hooks'),
          '@utils': resolve(__dirname, '../src/utils'),
          '@services': resolve(__dirname, '../src/services'),
          '@stores': resolve(__dirname, '../src/stores'),
          '@types': resolve(__dirname, '../src/types'),
          '@assets': resolve(__dirname, '../src/assets'),
          '@styles': resolve(__dirname, '../src/styles'),
          '@stories': resolve(__dirname, '../src/stories'),
          '@storybook': resolve(__dirname, './')
        }
      },
      
      // Define global variables
      define: {
        __DEV__: true,
        __STORYBOOK__: true,
        __PROD__: false,
        __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
        global: 'globalThis'
      },
      
      // CSS configuration
      css: {
        postcss: {
          plugins: [
            require('tailwindcss'),
            require('autoprefixer')
          ]
        }
      },
      
      // Optimizations
      optimizeDeps: {
        include: [
          '@storybook/react',
          '@storybook/addon-essentials',
          '@storybook/addon-interactions',
          'react',
          'react-dom',
          '@radix-ui/react-slot',
          '@radix-ui/react-dialog',
          '@radix-ui/react-dropdown-menu',
          'lucide-react',
          'clsx',
          'tailwind-merge'
        ]
      },
      
      // Server configuration for development
      server: {
        fs: {
          allow: ['..', '../..']
        }
      },
      
      // Build configuration
      build: {
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        
        // Rollup options
        rollupOptions: {
          output: {
            manualChunks: {
              'storybook-vendor': [
                '@storybook/react',
                '@storybook/addon-essentials',
                '@storybook/addon-interactions'
              ],
              'react-vendor': [
                'react',
                'react-dom'
              ],
              'ui-vendor': [
                '@radix-ui/react-slot',
                '@radix-ui/react-dialog',
                '@radix-ui/react-dropdown-menu',
                'lucide-react'
              ]
            }
          }
        }
      },
      
      // Worker configuration
      worker: {
        format: 'es'
      },
      
      // ESBuild configuration
      esbuild: {
        logOverride: {
          'this-is-undefined-in-esm': 'silent'
        }
      }
    });
  },
  
  // Core configuration
  core: {
    disableTelemetry: true,
    enableCrashReports: false
  },
  
  // Refs for composition
  refs: {
    // Add external Storybooks here if needed
    // 'design-system': {
    //   title: 'Design System',
    //   url: 'https://design-system-storybook.com'
    // }
  },
  
  // Presets
  presets: [],
  
  // Manager configuration
  managerHead: (head) => `
    ${head}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="theme-color" content="#000000" />
    <style>
      /* Custom Storybook manager styles */
      .sidebar-container {
        background: var(--color-bg-primary) !important;
      }
      
      .sidebar-item {
        color: var(--color-text-primary) !important;
      }
      
      .sidebar-item[data-selected="true"] {
        background: var(--color-bg-secondary) !important;
        color: var(--color-text-accent) !important;
      }
    </style>
  `,
  
  // Preview head
  previewHead: (head) => `
    ${head}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      /* Global styles for Storybook preview */
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        margin: 0;
        padding: 0;
      }
      
      code {
        font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
      }
    </style>
  `
};

export default config;