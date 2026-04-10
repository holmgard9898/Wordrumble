import { useState, useEffect } from 'react';
import type { GameLanguage } from '@/data/languages';
import { getLanguageConfig } from '@/data/languages';

export function useDictionary(language: GameLanguage = 'en') {
  const [words, setWords] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setWords(null);

    const config = getLanguageConfig(language);

    fetch(config.dictUrl)
      .then((res) => res.text())
      .then((text) => {
        const wordSet = new Set<string>();
        text.split(/\r?\n/).forEach((w) => {
          const trimmed = w.trim().toLowerCase();
          if (
            trimmed.length >= 3 &&
            trimmed.length <= 10 &&
            config.validCharPattern.test(trimmed) &&
            !config.blockedNames.has(trimmed)
          ) {
            wordSet.add(trimmed);
          }
        });
        setWords(wordSet);
        setLoading(false);
      })
      .catch(() => {
        // Minimal fallback
        setWords(new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had']));
        setLoading(false);
      });
  }, [language]);

  const isValidWord = (word: string): boolean => {
    if (!words) return false;
    return words.has(word.toLowerCase());
  };

  return { isValidWord, loading, wordCount: words?.size ?? 0, words };
}
