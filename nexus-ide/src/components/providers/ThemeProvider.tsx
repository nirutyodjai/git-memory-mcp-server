import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'dark',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'nexus-ide-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    let effectiveTheme: 'dark' | 'light';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme;
    }

    root.classList.add(effectiveTheme);
    setActualTheme(effectiveTheme);

    // Update CSS custom properties for better theme integration
    if (effectiveTheme === 'dark') {
      root.style.colorScheme = 'dark';
    } else {
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setActualTheme(systemTheme);
      
      root.style.colorScheme = systemTheme;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
      
      // Dispatch theme change event for other components
      window.dispatchEvent(
        new CustomEvent('nexus:theme-changed', {
          detail: { theme, actualTheme: theme === 'system' ? actualTheme : theme },
        })
      );
    },
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

// Theme utilities
export const getThemeColors = (theme: 'dark' | 'light') => {
  if (theme === 'dark') {
    return {
      background: 'hsl(222.2 84% 4.9%)',
      foreground: 'hsl(210 40% 98%)',
      primary: 'hsl(217.2 91.2% 59.8%)',
      secondary: 'hsl(217.2 32.6% 17.5%)',
      accent: 'hsl(217.2 32.6% 17.5%)',
      muted: 'hsl(217.2 32.6% 17.5%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      card: 'hsl(222.2 84% 4.9%)',
    };
  } else {
    return {
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      primary: 'hsl(221.2 83.2% 53.3%)',
      secondary: 'hsl(210 40% 96%)',
      accent: 'hsl(210 40% 96%)',
      muted: 'hsl(210 40% 96%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      card: 'hsl(0 0% 100%)',
    };
  }
};

// Theme presets for different coding environments
export const themePresets = {
  'vs-code-dark': {
    name: 'VS Code Dark',
    colors: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      primary: '#007acc',
      secondary: '#2d2d30',
      accent: '#094771',
      muted: '#3c3c3c',
      border: '#464647',
      card: '#252526',
    },
  },
  'github-dark': {
    name: 'GitHub Dark',
    colors: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      primary: '#58a6ff',
      secondary: '#21262d',
      accent: '#30363d',
      muted: '#484f58',
      border: '#30363d',
      card: '#161b22',
    },
  },
  'dracula': {
    name: 'Dracula',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      primary: '#bd93f9',
      secondary: '#44475a',
      accent: '#6272a4',
      muted: '#44475a',
      border: '#6272a4',
      card: '#44475a',
    },
  },
  'monokai': {
    name: 'Monokai',
    colors: {
      background: '#272822',
      foreground: '#f8f8f2',
      primary: '#a6e22e',
      secondary: '#3e3d32',
      accent: '#49483e',
      muted: '#75715e',
      border: '#49483e',
      card: '#3e3d32',
    },
  },
  'solarized-dark': {
    name: 'Solarized Dark',
    colors: {
      background: '#002b36',
      foreground: '#839496',
      primary: '#268bd2',
      secondary: '#073642',
      accent: '#586e75',
      muted: '#586e75',
      border: '#073642',
      card: '#073642',
    },
  },
} as const;

export type ThemePreset = keyof typeof themePresets;

// Apply theme preset
export const applyThemePreset = (preset: ThemePreset) => {
  const root = document.documentElement;
  const colors = themePresets[preset].colors;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Dispatch preset change event
  window.dispatchEvent(
    new CustomEvent('nexus:theme-preset-changed', {
      detail: { preset, colors },
    })
  );
};

// Get system theme preference
export const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Theme transition utility
export const enableThemeTransition = () => {
  const css = document.createElement('style');
  css.type = 'text/css';
  css.appendChild(
    document.createTextNode(
      `* {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
      }`
    )
  );
  document.head.appendChild(css);
  
  // Remove transition after animation completes
  setTimeout(() => {
    document.head.removeChild(css);
  }, 300);
};

// Export theme context for advanced usage
export { ThemeProviderContext };