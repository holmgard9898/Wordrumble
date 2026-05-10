/**
 * Adventure 3-1 ("The Crash") — pre-built puzzle boards.
 *
 * Design: target letters (BLUE) sit in column 3 with one RED letter between
 * each pair. Each red row also contains a 3-letter language combo word
 * (cols 1-2-3, with cols 1 & 2 swapped from final order). Player solves by
 * making one swap per combo row to spell that word — popping 3 red cells in
 * cols 1-3, which causes blues above to fall one row. After (N-1) such
 * combos, all N blue letters end up vertically adjacent in correct order
 * and the target word auto-forms → win.
 *
 * Move budget = N - 1 (= word length - 1).
 */
import type { GameLanguage } from './languages';
import type { PresetCell } from './adventureLevels';
import type { BubbleColor } from './gameConstants';
import { ROWS, COLS } from './gameConstants';

/** Translation of "light" per language (uppercase). */
export const CAVE_TARGET_WORD: Record<GameLanguage, string> = {
  en: 'LIGHT',
  sv: 'LJUS',
  de: 'LICHT',
  es: 'LUZ',
  fr: 'LUEUR',
  it: 'LUCE',
  pt: 'LUZ',
  nl: 'LICHT',
  no: 'LYS',
  da: 'LYS',
  fi: 'VALO',
};

/**
 * Combo words used to "drop" target letters into place.
 * Need (target.length - 1) common 3-letter words per language.
 * All chosen as very frequent words present in standard dictionaries.
 */
const COMBO_WORDS: Record<GameLanguage, string[]> = {
  sv: ['BAR', 'SOL', 'TOM'],         // 3 → LJUS (4)
  en: ['BAR', 'SUN', 'CAT', 'RUN'],  // 4 → LIGHT (5)
  de: ['TAG', 'ROT', 'HUT', 'BAR'],  // 4 → LICHT (5)
  es: ['SOL', 'MAR'],                // 2 → LUZ (3)
  fr: ['BAR', 'ROI', 'SUR', 'TOI'],  // 4 → LUEUR (5)
  it: ['SOL', 'MAR', 'RIO'],         // 3 → LUCE (4)
  pt: ['SOL', 'MAR'],                // 2 → LUZ (3)
  nl: ['BAR', 'ROK', 'ZAK', 'BUS'],  // 4 → LICHT (5)
  no: ['SOL', 'BAR'],                // 2 → LYS (3)
  da: ['SOL', 'BAR'],                // 2 → LYS (3)
  fi: ['ASE', 'OSA', 'ISO'],         // 3 → VALO (4)
};

/** Move budget per language: word length − 1. */
export const CAVE_MOVES: Record<GameLanguage, number> = {
  en: 4, sv: 3, de: 4, es: 2, fr: 4, it: 3,
  pt: 2, nl: 4, no: 2, da: 2, fi: 3,
};

/** Filler colors (never red, never blue → no accidental matches). */
const FILLER_COLORS: BubbleColor[] = ['yellow', 'green', 'pink'];
/** Safe filler letters (avoid the 3-letter combo letters where possible). */
const FILLER_LETTERS = 'ENMDPKQWFY';

/** Mulberry32 deterministic PRNG. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return h;
}

export function buildCavePresetGrid(lang: GameLanguage): PresetCell[][] {
  const word = CAVE_TARGET_WORD[lang];
  const combos = COMBO_WORDS[lang];
  const N = word.length;
  const rng = mulberry32(hashCode(`cave-v2|${lang}|${word}`));

  // 1) Fill grid with safe non-red/non-blue letters.
  const grid: PresetCell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: PresetCell[] = [];
    for (let c = 0; c < COLS; c++) {
      let letter = FILLER_LETTERS[Math.floor(rng() * FILLER_LETTERS.length)];
      let color: BubbleColor = FILLER_COLORS[Math.floor(rng() * FILLER_COLORS.length)];
      // Avoid 3-in-row horizontally
      if (c >= 2 && row[c - 1].c === color && row[c - 2].c === color) {
        color = FILLER_COLORS[(FILLER_COLORS.indexOf(color) + 1) % FILLER_COLORS.length];
      }
      // Avoid 3-in-row vertically
      if (r >= 2 && grid[r - 1][c].c === color && grid[r - 2][c].c === color) {
        color = FILLER_COLORS[(FILLER_COLORS.indexOf(color) + 1) % FILLER_COLORS.length];
      }
      // Avoid same letter side-by-side
      if (c >= 1 && row[c - 1].l === letter) {
        letter = FILLER_LETTERS[(FILLER_LETTERS.indexOf(letter) + 1) % FILLER_LETTERS.length];
      }
      row.push({ l: letter, c: color });
    }
    grid.push(row);
  }

  // 2) Place target letters (BLUE) in column 3 at odd rows starting at 1.
  //    For N letters: rows 1, 3, 5, ..., 2N-1.
  for (let i = 0; i < N; i++) {
    const r = 1 + 2 * i;
    grid[r][3] = { l: word[i], c: 'blue' };
  }

  // 3) Place combo words (RED) in cols 1-2-3 at even rows starting at 2.
  //    Cols 1 and 2 are SWAPPED so the player must perform the swap to form
  //    the word. Col 3 holds the third (red) letter that, when popped,
  //    drops the blue stack above by one row.
  for (let i = 0; i < combos.length; i++) {
    const r = 2 + 2 * i;
    const w = combos[i];
    grid[r][1] = { l: w[1], c: 'red' };  // initially "wrong"
    grid[r][2] = { l: w[0], c: 'red' };  // initially "wrong"
    grid[r][3] = { l: w[2], c: 'red' };
    // Make sure col 0 and col 4 are NOT red, so the red run can't extend.
    if (grid[r][0].c === 'red') grid[r][0] = { l: grid[r][0].l, c: 'yellow' };
    if (grid[r][4].c === 'red') grid[r][4] = { l: grid[r][4].l, c: 'yellow' };
  }

  return grid;
}

export function buildAllCavePresetGrids(): Record<GameLanguage, PresetCell[][]> {
  const langs: GameLanguage[] = ['en','sv','de','es','fr','it','pt','nl','no','da','fi'];
  const out = {} as Record<GameLanguage, PresetCell[][]>;
  for (const l of langs) out[l] = buildCavePresetGrid(l);
  return out;
}

/** Story intro cards (shown before this puzzle level). */
export const CAVE_STORY: { title: Record<GameLanguage, string>; body: Record<GameLanguage, string> }[] = [
  {
    title: {
      en: 'AHHHH!!!', sv: 'AHHHH!!!', de: 'AHHHH!!!', es: '¡AHHHH!!!',
      fr: 'AHHHH !!!', it: 'AHHHH!!!', pt: 'AHHHH!!!', nl: 'AHHHH!!!',
      no: 'AHHHH!!!', da: 'AHHHH!!!', fi: 'AAAAH!!!',
    },
    body: {
      en: '', sv: '', de: '', es: '', fr: '', it: '', pt: '', nl: '', no: '', da: '', fi: '',
    },
  },
  {
    title: {
      en: 'Where are we?', sv: 'Var är vi?', de: 'Wo sind wir?',
      es: '¿Dónde estamos?', fr: 'Où sommes-nous ?', it: 'Dove siamo?',
      pt: 'Onde estamos?', nl: 'Waar zijn we?', no: 'Hvor er vi?',
      da: 'Hvor er vi?', fi: 'Missä olemme?',
    },
    body: {
      en: 'Looks like we crashed... where are we?',
      sv: 'Ser ut som vi kraschat... var är vi?',
      de: 'Sieht aus, als wären wir abgestürzt... wo sind wir?',
      es: 'Parece que nos hemos estrellado... ¿dónde estamos?',
      fr: 'On dirait que nous avons crashé... où sommes-nous ?',
      it: 'Sembra che ci siamo schiantati... dove siamo?',
      pt: 'Parece que despenhámos... onde estamos?',
      nl: 'Het lijkt erop dat we zijn neergestort... waar zijn we?',
      no: 'Det ser ut som vi har krasjet... hvor er vi?',
      da: 'Det ser ud til vi er styrtet... hvor er vi?',
      fi: 'Näyttää siltä että törmäsimme... missä olemme?',
    },
  },
  {
    title: {
      en: 'Flashlight dying...', sv: 'Ficklampan dör...',
      de: 'Taschenlampe geht aus...', es: 'Linterna agotándose...',
      fr: 'La lampe faiblit...', it: 'La torcia si spegne...',
      pt: 'Lanterna a apagar...', nl: 'Zaklamp gaat uit...',
      no: 'Lommelykten dør...', da: 'Lommelygten dør...',
      fi: 'Taskulamppu sammuu...',
    },
    body: {
      en: 'I have a flashlight... oh, looks like we\'re in a cave. But my batteries are running out. We have to find LIGHT.',
      sv: 'Jag har en ficklampa... oj, det ser ut som vi är i en grotta. Men mina batterier håller på att ta slut. Vi måste hitta LJUS.',
      de: 'Ich habe eine Taschenlampe... oh, wir scheinen in einer Höhle zu sein. Aber meine Batterien gehen zur Neige. Wir müssen LICHT finden.',
      es: 'Tengo una linterna... vaya, parece que estamos en una cueva. Pero las pilas se acaban. Tenemos que encontrar LUZ.',
      fr: 'J\'ai une lampe... oh, on dirait qu\'on est dans une grotte. Mais mes piles s\'épuisent. Il faut trouver de la LUEUR.',
      it: 'Ho una torcia... oh, sembra che siamo in una grotta. Ma le batterie si stanno esaurendo. Dobbiamo trovare LUCE.',
      pt: 'Tenho uma lanterna... oh, parece que estamos numa caverna. Mas as pilhas estão a acabar. Temos de encontrar LUZ.',
      nl: 'Ik heb een zaklamp... oh, het lijkt of we in een grot zijn. Maar mijn batterijen raken op. We moeten LICHT vinden.',
      no: 'Jeg har en lommelykt... oi, det ser ut som vi er i en hule. Men batteriene mine går tomme. Vi må finne LYS.',
      da: 'Jeg har en lommelygte... åh, det ser ud til vi er i en hule. Men batterierne er ved at løbe tør. Vi skal finde LYS.',
      fi: 'Minulla on taskulamppu... oho, näyttää siltä että olemme luolassa. Mutta paristot ovat loppumassa. Meidän on löydettävä VALO.',
    },
  },
];
