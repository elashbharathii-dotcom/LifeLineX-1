import { createContext, useContext } from 'react';
import { LanguageCode } from '../i18n';

interface ThemeLanguageContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

export const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};
