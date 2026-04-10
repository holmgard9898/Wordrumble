import { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations, getTranslationArray, type Translations } from '@/data/translations';
import type { GameLanguage } from '@/data/languages';

export function useTranslation() {
  const { settings } = useSettings();
  const lang = settings.language;
  const t = useMemo(() => getTranslations(lang), [lang]);

  const ta = (key: 'infoClassic' | 'infoSurge' | 'infoFiveplus' | 'infoOneword' | 'infoBomb') =>
    getTranslationArray(lang, key);

  return { t, ta, lang };
}
