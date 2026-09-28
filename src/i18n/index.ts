import en from './en.json';
import ta from './ta.json';
import hi from './hi.json';

export type LanguageCode = 'en' | 'ta' | 'hi';

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  en,
  ta,
  hi,
};

export const getTranslation = (key: string, lang: LanguageCode = 'en'): string => {
  const dict = dictionaries[lang] || dictionaries.en;
  return dict[key] || dictionaries.en[key] || key;
};

export const supportedLanguages: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];
