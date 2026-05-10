/**
 * Adventure 3-1 ("The Crash") — pre-built puzzle boards.
 *
 * Each board is 100% deterministic per language. The target word's letters
 * appear in BLUE only; all other cells use neutral non-target letters in
 * non-blue colors. The same language always sees the same starting grid.
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

/** Move budget per language — tight, requires planning but solvable. */
export const CAVE_MOVES: Record<GameLanguage, number> = {
  en: 11, sv: 9, de: 11, es: 7, fr: 11, it: 9,
  pt: 7, nl: 11, no: 7, da: 7, fi: 9,
};

/** Non-blue colors used to fill decoy cells. */
const DECOY_COLORS: BubbleColor[] = ['red', 'green', 'yellow', 'pink'];

/** Per-language safe filler letters (common, won't combine into trivial words). */
const FILLER_LETTERS: Record<GameLanguage, string> = {
  en: 'AENRTOMDPB',
  sv: 'AENRTOMDPB',
  de: 'AENRTOMDPB',
  es: 'AENROMDPCQ',
  fr: 'AENROMDPCQ',
  it: 'AENROMDPCQ',
  pt: 'AENROMDPCQ',
  nl: 'AENROMDPKQ',
  no: 'AENROMDPKQ',
  da: 'AENROMDPKQ',
  fi: 'AEIKMNOPRT',
};

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

/**
 * For each target word, layout the BLUE letters at scripted positions.
 * Pattern: spread the letters out on the bottom 3 rows (alternating columns)
 * so the player must cluster them. The first letter is placed near the top
 * of column 3 ("the trick letter") so a clear-the-column play matters.
 */
function targetPositions(word: string): { row: number; col: number; letter: string }[] {
  const out: { row: number; col: number; letter: string }[] = [];
  // First letter goes high up, in column 3
  out.push({ row: 1, col: 3, letter: word[0] });
  // Remaining letters spread on the bottom rows
  // Pattern by length:
  const rest = word.slice(1).split('');
  const slots: [number, number][] = [
    [9, 1], [9, 4], [9, 7], [8, 2], [8, 5], [8, 6],
  ];
  for (let i = 0; i < rest.length; i++) {
    const [r, c] = slots[i];
    out.push({ row: r, col: c, letter: rest[i] });
  }
  return out;
}

export function buildCavePresetGrid(lang: GameLanguage): PresetCell[][] {
  const word = CAVE_TARGET_WORD[lang];
  const fillers = FILLER_LETTERS[lang];
  const targets = targetPositions(word);
  const targetSet = new Map<string, string>();
  for (const t of targets) targetSet.set(`${t.row}-${t.col}`, t.letter);

  const rng = mulberry32(hashCode(`cave|${lang}|${word}`));
  const grid: PresetCell[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const row: PresetCell[] = [];
    for (let c = 0; c < COLS; c++) {
      const tk = `${r}-${c}`;
      if (targetSet.has(tk)) {
        row.push({ l: targetSet.get(tk)!, c: 'blue' });
      } else {
        // Pick decoy letter & color, avoiding adjacent matches with previous cells
        let letter = fillers[Math.floor(rng() * fillers.length)];
        let color: BubbleColor = DECOY_COLORS[Math.floor(rng() * DECOY_COLORS.length)];
        // Avoid 3-in-a-row of the same color horizontally
        const left = c >= 1 ? row[c - 1] : null;
        const left2 = c >= 2 ? row[c - 2] : null;
        if (left && left2 && left.c === color && left2.c === color) {
          color = DECOY_COLORS[(DECOY_COLORS.indexOf(color) + 1) % DECOY_COLORS.length];
        }
        // Avoid 3-in-a-row of the same color vertically
        const up = r >= 1 ? grid[r - 1][c] : null;
        const up2 = r >= 2 ? grid[r - 2][c] : null;
        if (up && up2 && up.c === color && up2.c === color) {
          color = DECOY_COLORS[(DECOY_COLORS.indexOf(color) + 1) % DECOY_COLORS.length];
        }
        // Avoid letter repetition next to itself
        if (left && left.l === letter) {
          letter = fillers[(fillers.indexOf(letter) + 1) % fillers.length];
        }
        row.push({ l: letter, c: color });
      }
    }
    grid.push(row);
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
