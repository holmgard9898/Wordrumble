export type GameLanguage = 'en' | 'sv' | 'de';

export interface LanguageConfig {
  code: GameLanguage;
  name: string;
  flag: string;
  dictUrl: string;
  letterValues: Record<string, number>;
  letterPool: string;
  vowels: Set<string>;
  validCharPattern: RegExp;
  blockedNames: Set<string>;
}

const EN_CONFIG: LanguageConfig = {
  code: 'en',
  name: 'English',
  flag: '🇬🇧',
  dictUrl: 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt',
  letterValues: {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
  },
  letterPool: 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUVVWWXYYZ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U']),
  validCharPattern: /^[a-z]+$/,
  blockedNames: new Set([
    'alan','alex','amy','anna','ben','bob','carl','dan','dave','ed','emma',
    'fred','gary','hal','ian','jack','jane','jim','joe','john','kate','ken',
    'lee','lisa','mark','mary','max','mike','nick','pat','paul','pete','ray',
    'rob','ron','roy','sam','sue','ted','tim','tom','will',
  ]),
};

const SV_CONFIG: LanguageConfig = {
  code: 'sv',
  name: 'Svenska',
  flag: '🇸🇪',
  dictUrl: 'https://raw.githubusercontent.com/martinlindhe/wordlist_swedish/master/swe_wordlist',
  letterValues: {
    A: 1, B: 4, C: 8, D: 1, E: 1, F: 3, G: 2, H: 3, I: 1, J: 7,
    K: 2, L: 1, M: 2, N: 1, O: 2, P: 4, R: 1, S: 1, T: 1,
    U: 4, V: 3, X: 8, Y: 7, Z: 10, Å: 4, Ä: 4, Ö: 4,
  },
  letterPool: 'AAAAAAAABBDDDDDEEEEEEEFFGGGHIIIIIJKKKLLLLLMMMNNNNNNOOOOOOPPRRRRRRRRSSSSSSSSSTTTTTTTTTUUUVVXYÅÅÄÄÖÖ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U', 'Å', 'Ä', 'Ö']),
  validCharPattern: /^[a-zåäö]+$/,
  blockedNames: new Set([
    'erik','anna','karl','lars','olof','per','sven','nils','johan','anders',
    'maria','eva','karin','lisa','sara','emma','ida','gustav','axel','oscar',
  ]),
};

const DE_CONFIG: LanguageConfig = {
  code: 'de',
  name: 'Deutsch',
  flag: '🇩🇪',
  dictUrl: 'https://raw.githubusercontent.com/enz/german-wordlist/main/words',
  letterValues: {
    A: 1, B: 3, C: 4, D: 1, E: 1, F: 4, G: 2, H: 2, I: 1, J: 6,
    K: 4, L: 2, M: 3, N: 1, O: 2, P: 4, Q: 10, R: 1, S: 1, T: 1,
    U: 1, V: 6, W: 3, X: 8, Y: 10, Z: 3, Ä: 6, Ö: 8, Ü: 6,
  },
  letterPool: 'AAAAABBCCDDDDEEEEEEEEEEEEEEEFFGGGHHHIIIIIIIJKKLLLMMMMNNNNNNNNNOOOPRRRRRRSSSSSSSSTTTTTTTUUUUUUVWXYZÄÖÜ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U', 'Ä', 'Ö', 'Ü']),
  validCharPattern: /^[a-zäöü]+$/,
  blockedNames: new Set([
    'hans','karl','fritz','heinrich','peter','anna','maria','bertha','otto','max',
  ]),
};

const CONFIGS: Record<GameLanguage, LanguageConfig> = {
  en: EN_CONFIG,
  sv: SV_CONFIG,
  de: DE_CONFIG,
};

export function getLanguageConfig(lang: GameLanguage): LanguageConfig {
  return CONFIGS[lang] ?? EN_CONFIG;
}

export const AVAILABLE_LANGUAGES: GameLanguage[] = ['en', 'sv', 'de'];
