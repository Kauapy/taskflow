import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, Theme } from '../styles/theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  a11yZoom: number;
  toggleA11yZoom: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('taskflow-theme');
    return saved === 'dark';
  });

  const [a11yZoom, setA11yZoom] = useState(() => {
    const saved = localStorage.getItem('taskflow-zoom');
    return saved ? Number(saved) : 1;
  });

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const toggleA11yZoom = () => {
    setA11yZoom(prev => {
      // Ciclo: 1 (Normal) -> 1.1 (Médio) -> 1.25 (Grande) -> 1
      const next = prev === 1 ? 1.1 : (prev === 1.1 ? 1.25 : 1);
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('taskflow-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('taskflow-zoom', a11yZoom.toString());
    // Aplica o zoom diretamente no HTML (suportado na maioria dos navegadores modernos)
    (document.documentElement.style as any).zoom = a11yZoom;
  }, [a11yZoom]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, a11yZoom, toggleA11yZoom }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};
