import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'midnight' | 'aurora' | 'daylight' | 'ember';

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  previewColors: string[];
}

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌑',
    description: 'Deep enterprise dark',
    previewColors: ['#06b6d4', '#3b82f6', '#0f1729']
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🌌',
    description: 'Violet cosmic energy',
    previewColors: ['#a855f7', '#ec4899', '#13072e']
  },
  {
    id: 'daylight',
    name: 'Daylight',
    emoji: '☀️',
    description: 'Clean minimal light',
    previewColors: ['#6366f1', '#3b82f6', '#f8fafc']
  },
  {
    id: 'ember',
    name: 'Ember',
    emoji: '🔥',
    description: 'Warm amber premium',
    previewColors: ['#f59e0b', '#ef4444', '#1a0f02']
  }
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  themeData: Theme;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

/** Apply data-theme attribute immediately to <html> — no async batching */
function applyThemeToDom(t: ThemeId) {
  document.documentElement.setAttribute('data-theme', t);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const validIds: ThemeId[] = ['midnight', 'aurora', 'daylight', 'ember'];
      const saved = localStorage.getItem('voyacore_theme') as ThemeId | null;
      return (saved && validIds.includes(saved)) ? saved : 'midnight';
    } catch (e) {
      return 'midnight';
    }
  });

  // Apply saved theme on first mount
  useEffect(() => {
    applyThemeToDom(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (t: ThemeId) => {
    // Apply to DOM immediately — don't wait for React render cycle
    applyThemeToDom(t);
    localStorage.setItem('voyacore_theme', t);
    setThemeState(t);
  };

  const themeData = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeData, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};
