/**
 * Storybook Preview Configuration for NEXUS IDE
 * 
 * This configuration sets up the preview environment for Storybook,
 * including global decorators, parameters, and theme configuration.
 */

import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { initialize, mswLoader } from 'msw-storybook-addon';

// Import global styles
import '../src/styles/globals.css';

// Initialize MSW
initialize({
  onUnhandledRequest: 'bypass'
});

// Custom viewports for NEXUS IDE
const customViewports = {
  nexusDesktop: {
    name: 'NEXUS Desktop',
    styles: {
      width: '1920px',
      height: '1080px'
    }
  },
  nexusLaptop: {
    name: 'NEXUS Laptop',
    styles: {
      width: '1366px',
      height: '768px'
    }
  },
  nexusTablet: {
    name: 'NEXUS Tablet',
    styles: {
      width: '1024px',
      height: '768px'
    }
  },
  nexusMobile: {
    name: 'NEXUS Mobile',
    styles: {
      width: '375px',
      height: '667px'
    }
  },
  nexusUltrawide: {
    name: 'NEXUS Ultrawide',
    styles: {
      width: '3440px',
      height: '1440px'
    }
  }
};

// Global decorators
const preview: Preview = {
  // Global parameters
  parameters: {
    // Actions configuration
    actions: { 
      argTypesRegex: '^on[A-Z].*',
      handles: ['mouseover', 'click', 'focus', 'blur']
    },
    
    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      },
      expanded: true,
      sort: 'requiredFirst'
    },
    
    // Documentation configuration
    docs: {
      theme: {
        base: 'dark',
        brandTitle: 'NEXUS IDE Components',
        brandUrl: 'https://nexus-ide.dev',
        brandImage: '/logo.svg',
        brandTarget: '_self'
      },
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3',
        ignoreSelector: '#primary',
        title: 'Table of Contents',
        disable: false,
        unsafeTocbotOptions: {
          orderedList: false
        }
      }
    },
    
    // Layout configuration
    layout: 'centered',
    
    // Viewport configuration
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        ...customViewports
      },
      defaultViewport: 'nexusDesktop'
    },
    
    // Background configuration
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a'
        },
        {
          name: 'light',
          value: '#ffffff'
        },
        {
          name: 'gray',
          value: '#f5f5f5'
        },
        {
          name: 'nexus-dark',
          value: '#1a1a1a'
        },
        {
          name: 'nexus-light',
          value: '#fafafa'
        }
      ]
    },
    
    // Themes configuration
    themes: {
      default: 'dark',
      list: [
        {
          name: 'dark',
          class: 'dark',
          color: '#0a0a0a'
        },
        {
          name: 'light',
          class: 'light',
          color: '#ffffff'
        }
      ]
    },
    
    // Accessibility configuration
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'focus-trap',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          }
        ]
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true
      }
    },
    
    // Interactions configuration
    interactions: {
      disable: false
    },
    
    // Measure addon configuration
    measure: {
      results: {
        precision: 2,
        margin: true,
        padding: true,
        border: true,
        boxSizing: true
      }
    },
    
    // Outline addon configuration
    outline: {
      disable: false
    },
    
    // Design tokens configuration
    designTokens: {
      disable: false
    },
    
    // Jest configuration
    jest: {
      disable: false
    },
    
    // Coverage configuration
    coverage: {
      disable: false
    },
    
    // Console addon configuration
    console: {
      disable: false
    },
    
    // Figma addon configuration
    figma: {
      url: 'https://www.figma.com/file/your-figma-file-id'
    },
    
    // Options configuration
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'Design System',
          ['Colors', 'Typography', 'Spacing', 'Icons'],
          'Components',
          ['Basic', 'Layout', 'Navigation', 'Forms', 'Feedback', 'Data Display', 'Overlays'],
          'Features',
          ['Editor', 'Terminal', 'File Explorer', 'AI Assistant', 'Collaboration'],
          'Examples',
          'Utilities'
        ],
        locales: 'en-US'
      },
      showRoots: true
    }
  },
  
  // Global decorators
  decorators: [
    // Theme decorator
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark'
      },
      defaultTheme: 'dark'
    }),
    
    // Layout decorator
    (Story, context) => {
      const { parameters } = context;
      const layout = parameters.layout || 'centered';
      
      return (
        <div 
          className={`storybook-layout storybook-layout--${layout}`}
          style={{
            padding: layout === 'fullscreen' ? 0 : '1rem',
            minHeight: layout === 'fullscreen' ? '100vh' : 'auto',
            display: layout === 'centered' ? 'flex' : 'block',
            alignItems: layout === 'centered' ? 'center' : 'stretch',
            justifyContent: layout === 'centered' ? 'center' : 'stretch'
          }}
        >
          <Story />
        </div>
      );
    },
    
    // Provider decorator for context providers
    (Story, context) => {
      // Add any global providers here
      return (
        <div className="nexus-ide-root">
          <Story />
        </div>
      );
    },
    
    // Error boundary decorator
    (Story, context) => {
      try {
        return <Story />;
      } catch (error) {
        console.error('Storybook Error:', error);
        return (
          <div className="storybook-error">
            <h2>Story Error</h2>
            <p>An error occurred while rendering this story.</p>
            <details>
              <summary>Error Details</summary>
              <pre>{error instanceof Error ? error.stack : String(error)}</pre>
            </details>
          </div>
        );
      }
    }
  ],
  
  // Global loaders
  loaders: [
    mswLoader
  ],
  
  // Global args
  args: {},
  
  // Global arg types
  argTypes: {
    // Common prop types
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    children: {
      control: 'text',
      description: 'Child elements'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled'
    },
    loading: {
      control: 'boolean',
      description: 'Whether the component is in loading state'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Component size'
    },
    variant: {
      control: 'select',
      description: 'Component variant'
    },
    theme: {
      control: 'select',
      options: ['light', 'dark', 'auto'],
      description: 'Theme variant'
    }
  },
  
  // Global render function
  render: undefined,
  
  // Tags
  tags: ['autodocs']
};

export default preview;