'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translations } from '@/lib/translations';

// ISO 3166-1 alpha-2 codes of francophone countries
const FRANCOPHONE_COUNTRIES = new Set([
  'FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'SN', 'CI', 'ML', 'BF',
  'NE', 'TD', 'CM', 'CG', 'CD', 'GA', 'GN', 'GQ', 'BJ', 'TG',
  'DZ', 'MA', 'TN', 'MG', 'MU', 'SC', 'KM', 'DJ', 'RW', 'BI',
  'HT', 'RE', 'GP', 'MQ', 'GF', 'PM', 'WF', 'PF', 'NC', 'YT',
  'MF', 'BL', 'VU', 'CF',
]);

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  t: translations['fr'],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('fr');

  useEffect(() => {
    // 1. Check localStorage for a saved user preference
    const saved = localStorage.getItem('southpaw_lang') as Language | null;
    if (saved === 'fr' || saved === 'en') {
      setLangState(saved);
      document.documentElement.lang = saved;
      return;
    }

    // 2. Detect country via IP geolocation
    const detectLanguage = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('https://api.country.is', { signal: controller.signal });
        clearTimeout(timeout);
        const data = await res.json();
        const countryCode = (data.country as string)?.toUpperCase();
        const detected: Language = FRANCOPHONE_COUNTRIES.has(countryCode) ? 'fr' : 'en';
        setLangState(detected);
        document.documentElement.lang = detected;
      } catch {
        // 3. Fallback to browser language
        const browserLang = navigator.language?.toLowerCase() ?? '';
        const detected: Language = browserLang.startsWith('fr') ? 'fr' : 'en';
        setLangState(detected);
        document.documentElement.lang = detected;
      }
    };

    detectLanguage();
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('southpaw_lang', newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
