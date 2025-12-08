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

interface ThemeContextType {
  currentTheme: ThemeConfig;
  themes: ThemeConfig[];
  setTheme: (theme: ThemeConfig) => void;
  nextTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'newave-color-theme';

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

  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTheme));
  }, [currentTheme]);

  const setTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
  };

  const nextTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.name === currentTheme.name);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setCurrentTheme(THEMES[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themes: THEMES, setTheme, nextTheme }}>
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
