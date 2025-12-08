import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeConfig {
  name: string;
  hue: number;
  saturation: number;
  lightness: number;
}

const THEMES: ThemeConfig[] = [
  { name: "Plum", hue: 270, saturation: 70, lightness: 50 },
  { name: "Deep Plum", hue: 270, saturation: 80, lightness: 40 },
  { name: "Bright Plum", hue: 275, saturation: 75, lightness: 60 },
  { name: "Plum Rose", hue: 290, saturation: 65, lightness: 50 },
  { name: "Plum Midnight", hue: 265, saturation: 85, lightness: 35 },
  { name: "Plum Soft", hue: 268, saturation: 60, lightness: 55 },
  { name: "Ocean", hue: 200, saturation: 70, lightness: 45 },
  { name: "Forest", hue: 140, saturation: 60, lightness: 40 },
  { name: "Sunset", hue: 25, saturation: 80, lightness: 50 },
  { name: "Berry", hue: 330, saturation: 70, lightness: 45 },
  { name: "Gold", hue: 45, saturation: 85, lightness: 50 },
  { name: "Teal", hue: 175, saturation: 65, lightness: 40 },
];

type Mode = 'light' | 'dark';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  themes: ThemeConfig[];
  setTheme: (theme: ThemeConfig) => void;
  nextTheme: () => void;
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'newave-color-theme';
const MODE_STORAGE_KEY = 'newave-mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return THEMES[0];
      }
    }
    return THEMES[0];
  });

  const [mode, setModeState] = useState<Mode>(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const applyTheme = (theme: ThemeConfig) => {
    const root = document.documentElement;
    
    // Primary brand color
    root.style.setProperty('--brand', `${theme.hue} ${theme.saturation}% ${theme.lightness}%`);
    
    // Secondary brand color (complementary shift)
    const brand2Hue = (theme.hue + 40) % 360;
    root.style.setProperty('--brand-2', `${brand2Hue} ${theme.saturation}% ${theme.lightness}%`);
    
    // Update primary color for buttons and UI elements
    root.style.setProperty('--primary', `${theme.hue} ${theme.saturation - 10}% ${theme.lightness - 5}%`);
    root.style.setProperty('--primary-foreground', `0 0% 100%`);
    
    // Update ring color
    root.style.setProperty('--ring', `${theme.hue} ${theme.saturation}% ${theme.lightness}%`);
    
    // Update sidebar colors
    root.style.setProperty('--sidebar-primary', `${theme.hue} ${theme.saturation}% ${theme.lightness}%`);
    root.style.setProperty('--sidebar-ring', `${theme.hue} ${theme.saturation}% ${theme.lightness + 10}%`);
  };

  const applyMode = (mode: Mode) => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTheme));
  }, [currentTheme]);

  useEffect(() => {
    applyMode(mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  const setTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
  };

  const nextTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.name === currentTheme.name);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setCurrentTheme(THEMES[nextIndex]);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themes: THEMES, setTheme, nextTheme, mode, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
