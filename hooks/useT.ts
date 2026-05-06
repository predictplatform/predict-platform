import { useLang } from '@/contexts/LanguageContext';
import { translations } from '@/lib/i18n';

export function useT() {
  const { lang } = useLang();
  return translations[lang];
}
