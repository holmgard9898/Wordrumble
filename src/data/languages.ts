export type GameLanguage = 'en' | 'sv' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'nl' | 'no' | 'da' | 'fi';

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
    'alan','alex','amy','anna','ben','carl','emma','fred','gary','ian',
    'jane','jim','joe','john','kate','lisa','mary','mike',
    'paul','pete','ron','tim', 'eth', 'eff', 'effs', 'eths', 'aba', 'aby', 'ait', 'ane', 'ani', 'avo', 'azo', 'ene', 'ide'
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
    'maria','eva','karin','lisa','sara','emma','ida','gustav','oscar',
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

const ES_CONFIG: LanguageConfig = {
  code: 'es',
  name: 'Español',
  flag: '🇪🇸',
  dictUrl: 'https://raw.githubusercontent.com/JorgeDuenasLerin/diccionario-espanol-txt/master/0_palabras_todas.txt',
  letterValues: {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 8, L: 1, M: 3, N: 1, Ñ: 8, O: 1, P: 3, Q: 5, R: 1, S: 1,
    T: 1, U: 1, V: 4, W: 8, X: 8, Y: 4, Z: 10,
  },
  letterPool: 'AAAAAAAAAAAABBCCCDDDDDEEEEEEEEEEEEEEFFGGHHIIIIIIIJKLLLLLLMMNNNNNÑOOOOOOOOPPQRRRRRRRRSSSSSSSSTTTTTTUUUUUVWXYZ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U']),
  validCharPattern: /^[a-záéíóúñü]+$/,
  blockedNames: new Set([
    'juan','pedro','maria','jose','luis','ana','carlos','rosa','miguel','elena',
  ]),
};

const FR_CONFIG: LanguageConfig = {
  code: 'fr',
  name: 'Français',
  flag: '🇫🇷',
  dictUrl: 'https://raw.githubusercontent.com/chrplr/openlexicon/master/datasets-info/Liste-de-mots-francais-Gutenberg/liste.de" \
  + ".mots.francais.frgut.txt',
  letterValues: {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 10, L: 1, M: 2, N: 1, O: 1, P: 3, Q: 8, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 10, X: 10, Y: 10, Z: 10,
  },
  letterPool: 'AAAAAAAAABBCCDDDEEEEEEEEEEEEEEEEFFGGHIIIIIIIIIJKLLLLLLMMMNNNNNNNOOOOOOPPQRRRRRRSSSSSSSSTTTTTTTUUUUUUVWXYZ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U']),
  validCharPattern: /^[a-zàâæçéèêëïîôœùûüÿ]+$/,
  blockedNames: new Set([
    'jean','pierre','marie','louis','anne','paul','claire','jacques','henri','emma',
  ]),
};

const IT_CONFIG: LanguageConfig = {
  code: 'it',
  name: 'Italiano',
  flag: '🇮🇹',
  dictUrl: 'https://raw.githubusercontent.com/napolux/parern/master/parole.txt',
  letterValues: {
    A: 1, B: 5, C: 2, D: 5, E: 1, F: 5, G: 8, H: 8, I: 1, J: 8,
    K: 8, L: 3, M: 3, N: 3, O: 1, P: 5, Q: 10, R: 2, S: 2, T: 2,
    U: 3, V: 5, W: 8, X: 8, Y: 8, Z: 8,
  },
  letterPool: 'AAAAAAAAAAAABBCCCCDDDDEEEEEEEEEEEEFFFGGGHHIIIIIIIIIIILLLLLMMMNNNNNNOOOOOOOOPPPQRRRRRRRSSSSSSTTTTTTTUUUUVVZZ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U']),
  validCharPattern: /^[a-zàèéìòù]+$/,
  blockedNames: new Set([
    'marco','giulia','paolo','maria','anna','giovanni','luca','rosa','carlo','elena',
  ]),
};

const PT_CONFIG: LanguageConfig = {
  code: 'pt',
  name: 'Português',
  flag: '🇵🇹',
  dictUrl: 'https://raw.githubusercontent.com/fserb/pt-br/master/palavras',
  letterValues: {
    A: 1, B: 3, C: 2, D: 2, E: 1, F: 4, G: 4, H: 4, I: 1, J: 5,
    K: 8, L: 2, M: 1, N: 3, O: 1, P: 2, Q: 6, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 8, X: 8, Y: 8, Z: 8,
  },
  letterPool: 'AAAAAAAAAAAABBCCCCDDDDEEEEEEEEEEEEEFFGGHHIIIIIIIIIJKLLLLMMMMNNNNOOOOOOOOPPQRRRRRRSSSSSSSSTTTTTTTUUUUVVXYZ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U']),
  validCharPattern: /^[a-záàâãéèêíìîóòôõúùûç]+$/,
  blockedNames: new Set([
    'joao','pedro','maria','ana','jose','carlos','paulo','antonio','luis','rosa',
  ]),
};

const NL_CONFIG: LanguageConfig = {
  code: 'nl',
  name: 'Nederlands',
  flag: '🇳🇱',
  dictUrl: 'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt',
  letterValues: {
    A: 1, B: 3, C: 5, D: 2, E: 1, F: 4, G: 3, H: 4, I: 1, J: 4,
    K: 3, L: 3, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 2, S: 2, T: 2,
    U: 4, V: 4, W: 5, X: 8, Y: 8, Z: 4,
  },
  letterPool: 'AAAAAABBDDDDEEEEEEEEEEEEFFGGHHIIIIIJKKLLLMMNNNNNNOOOOOOPPRRRRSSSSTTTTTTUUUVVWXYZ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U']),
  validCharPattern: /^[a-z]+$/,
  blockedNames: new Set([
    'jan','pieter','maria','anna','johannes','hendrika','willem','cornelis','dirk','gerrit',
  ]),
};

const NO_CONFIG: LanguageConfig = {
  code: 'no',
  name: 'Norsk',
  flag: '🇳🇴',
  dictUrl: 'https://raw.githubusercontent.com/Wikipedia-TF/all_norwegian_words/main/norwegian.txt',
  letterValues: {
    A: 1, B: 4, C: 10, D: 1, E: 1, F: 2, G: 2, H: 3, I: 1, J: 4,
    K: 2, L: 1, M: 2, N: 1, O: 2, P: 4, R: 1, S: 1, T: 1,
    U: 4, V: 4, W: 8, X: 8, Y: 6, Z: 10, Æ: 6, Ø: 5, Å: 4,
  },
  letterPool: 'AAAAAABBDDDDEEEEEEEEEFFGGGGHIIIIIJKKKLLLLMMMNNNNNNOOOOOPPRRRRRRRSSSSSSSSTTTTTTTTUUUVVYÆØÅÅ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U', 'Æ', 'Ø', 'Å']),
  validCharPattern: /^[a-zæøå]+$/,
  blockedNames: new Set([
    'erik','anna','lars','ole','per','kari','hans','nils','johan','magnus',
  ]),
};

const DA_CONFIG: LanguageConfig = {
  code: 'da',
  name: 'Dansk',
  flag: '🇩🇰',
  dictUrl: 'https://raw.githubusercontent.com/Esjansen/Danish-Wordlist/master/Wordlist',
  letterValues: {
    A: 1, B: 3, C: 8, D: 2, E: 1, F: 3, G: 3, H: 4, I: 3, J: 4,
    K: 3, L: 2, M: 3, N: 1, O: 2, P: 4, R: 1, S: 1, T: 2,
    U: 3, V: 3, W: 8, X: 8, Y: 4, Z: 9, Æ: 4, Ø: 4, Å: 4,
  },
  letterPool: 'AAAAAABBDDDDEEEEEEEEEFFGGGHIIIIIJKKKLLLLMMMNNNNNNOOOOOOPPRRRRRRRSSSSSSSSTTTTTTTTUUUVVYÆØÅÅ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U', 'Æ', 'Ø', 'Å']),
  validCharPattern: /^[a-zæøå]+$/,
  blockedNames: new Set([
    'erik','anna','lars','hans','jens','peter','karl','niels','poul','søren',
  ]),
};

const FI_CONFIG: LanguageConfig = {
  code: 'fi',
  name: 'Suomi',
  flag: '🇫🇮',
  dictUrl: 'https://raw.githubusercontent.com/hugovk/everyfinnishword/master/kaikkisanat.txt',
  letterValues: {
    A: 1, B: 8, C: 10, D: 7, E: 1, F: 8, G: 8, H: 4, I: 1, J: 4,
    K: 2, L: 2, M: 3, N: 1, O: 2, P: 4, R: 4, S: 1, T: 1,
    U: 4, V: 4, W: 8, X: 8, Y: 4, Z: 10, Ä: 2, Ö: 7,
  },
  letterPool: 'AAAAAAAAABBDDEEEEEEEEEFFGHHIIIIIIIIJKKKKKLLLLLMMMNNNNNNNOOOOOPPPRRRSSSSSSSTTTTTTTTTUUUUUVVYYÄÄÖÖ',
  vowels: new Set(['A', 'E', 'I', 'O', 'U', 'Ä', 'Ö', 'Y']),
  validCharPattern: /^[a-zäö]+$/,
  blockedNames: new Set([
    'matti','anna','juha','maria','mikko','tuula','pekka','leena','jari','sari',
  ]),
};

const CONFIGS: Record<GameLanguage, LanguageConfig> = {
  en: EN_CONFIG,
  sv: SV_CONFIG,
  de: DE_CONFIG,
  es: ES_CONFIG,
  fr: FR_CONFIG,
  it: IT_CONFIG,
  pt: PT_CONFIG,
  nl: NL_CONFIG,
  no: NO_CONFIG,
  da: DA_CONFIG,
  fi: FI_CONFIG,
};

export function getLanguageConfig(lang: GameLanguage): LanguageConfig {
  return CONFIGS[lang] ?? EN_CONFIG;
}

export const AVAILABLE_LANGUAGES: GameLanguage[] = ['en', 'sv', 'de', 'es', 'fr', 'it', 'pt', 'nl', 'no', 'da', 'fi'];
