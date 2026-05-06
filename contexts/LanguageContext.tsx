'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '@/lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ar',
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to 'ar' for SSR safety — no window/localStorage on the server
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    // 1) Persisted preference wins
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored === 'ar' || stored === 'en') {
      setLangState(stored);
      return;
    }
    // 2) Detect from browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ar')) {
      setLangState('ar');
    } else {
      setLangState('en');
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}
