import React from 'react';
import type { TutorialStep } from '@/components/TutorialModal';
import type { GameLanguage } from './languages';
import type { AdventureLevel } from './adventureLevels';

// ─── tiny i18n helper (sv + en authored, others fallback to en) ──────────
type Bi = { en: string; sv: string };
const pick = (b: Bi, lang: GameLanguage) => (lang === 'sv' ? b.sv : b.en);

// ─── visuals ─────────────────────────────────────────────────────────────
const Bubble: React.FC<{ ch: string; color: string; ring?: boolean; dim?: boolean }> = ({ ch, color, ring, dim }) => (
  <div
    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base ${ring ? 'ring-2 ring-yellow-300' : ''}`}
    style={{
      background: `radial-gradient(circle at 30% 30%, ${color}ee, ${color}aa)`,
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.25)',
      opacity: dim ? 0.45 : 1,
    }}
  >
    {ch}
  </div>
);

const HiddenWordVisual: React.FC<{ revealed: number; word: string }> = ({ revealed, word }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="flex gap-1.5">
      {word.split('').map((ch, i) => (
        <div key={i} className="w-8 h-10 rounded-md flex items-center justify-center font-bold text-lg"
             style={{ background: i < revealed ? 'rgba(253,224,71,0.25)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: i < revealed ? '#FDE68A' : 'transparent' }}>
          {i < revealed ? ch : '?'}
        </div>
      ))}
    </div>
    <div className="text-white/60 text-xs">→</div>
    <div className="flex gap-1.5">
      <Bubble ch="K" color="#22C55E" />
      <Bubble ch="A" color="#22C55E" />
      <Bubble ch="T" color="#22C55E" />
      <Bubble ch="T" color="#22C55E" />
    </div>
  </div>
);

const InfectionVisual: React.FC = () => (
  <div className="flex items-center gap-2">
    <Bubble ch="A" color="#A855F7" />
    <div className="text-purple-300">→</div>
    <Bubble ch="A" color="#A855F7" ring />
    <div className="text-white/40">·10</div>
    <div className="text-white/30">→</div>
    <Bubble ch="A" color="#A855F7" dim />
    <div className="text-white/40 text-xs">spöke</div>
  </div>
);

const AsteroidVisual: React.FC = () => (
  <div className="grid grid-cols-3 gap-1.5">
    <Bubble ch="C" color="#3B82F6" />
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
         style={{ background: 'radial-gradient(circle at 30% 30%, #71717a, #27272a)', boxShadow: '0 0 8px rgba(0,0,0,0.5)' }}>☄️</div>
    <Bubble ch="T" color="#22C55E" />
    <Bubble ch="O" color="#EF4444" />
    <Bubble ch="R" color="#F59E0B" />
    <Bubble ch="N" color="#A855F7" />
  </div>
);

const SatelliteVisual: React.FC = () => (
  <div className="grid grid-cols-3 gap-1.5">
    <Bubble ch="S" color="#3B82F6" />
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
         style={{ background: 'radial-gradient(circle, #475569, #1e293b)', boxShadow: '0 0 12px rgba(125,211,252,0.6)' }}>🛰️</div>
    <Bubble ch="N" color="#22C55E" />
  </div>
);

const RocketVisual: React.FC = () => (
  <div className="flex items-end gap-1">
    <Bubble ch="A" color="#EF4444" />
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
         style={{ background: 'radial-gradient(circle, #fde68a, #f59e0b)', boxShadow: '0 0 14px rgba(253,224,71,0.7)' }}>🚀</div>
    <Bubble ch="C" color="#22C55E" />
  </div>
);

const PowerupSwapVisual: React.FC = () => (
  <div className="flex items-center gap-2">
    <Bubble ch="X" color="#EF4444" />
    <div className="text-yellow-300 text-2xl">⇄</div>
    <Bubble ch="A" color="#22C55E" />
  </div>
);

const AntigravityVisual: React.FC = () => (
  <div className="flex flex-col items-center gap-1">
    <div className="text-yellow-300 text-xl">↑</div>
    <Bubble ch="A" color="#3B82F6" />
    <div className="text-white/30 text-xs">↑ uppåt</div>
  </div>
);

const UfoVisual: React.FC = () => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
         style={{ background: 'radial-gradient(circle, #475569, #1e293b)' }}>🛸</div>
    <div className="text-yellow-300 text-xs">↓ byter under</div>
    <Bubble ch="?" color="#A855F7" />
  </div>
);

const CaveVisual: React.FC = () => (
  <div className="flex flex-col items-center gap-1">
    <div className="text-stone-400 text-xs">⛰️ stenar faller</div>
    <div className="grid grid-cols-3 gap-1">
      <div className="w-8 h-8 rounded-md bg-stone-700" />
      <div className="w-8 h-8 rounded-md bg-stone-700" />
      <div className="w-8 h-8 rounded-md bg-stone-700" />
    </div>
    <Bubble ch="E" color="#22C55E" />
  </div>
);

// ─── concept registry ────────────────────────────────────────────────────
type ConceptId =
  | 'mode-classic' | 'mode-surge' | 'mode-fiveplus' | 'mode-oneword' | 'mode-bomb'
  | 'infection' | 'hidden-word' | 'two-hidden-words'
  | 'antigravity' | 'asteroids' | 'satellite' | 'ufos' | 'collapsing-cave'
  | 'free-rockets' | 'start-powerups';

interface ConceptDef {
  id: ConceptId;
  steps: (lang: GameLanguage) => TutorialStep[];
}

const CONCEPTS: Record<ConceptId, ConceptDef> = {
  'mode-classic': {
    id: 'mode-classic',
    steps: (lang) => [
      {
        title: pick({ en: 'Swap & spell', sv: 'Byt & stava' }, lang),
        body: pick({
          en: 'Tap two adjacent bubbles to swap them. Get bubbles of the SAME color in a row to spell a word.',
          sv: 'Tryck på två bubblor bredvid varandra för att byta plats. Få bubblor med SAMMA färg i rad — då bildar de ett ord.',
        }, lang),
      },
      {
        title: pick({ en: 'Bonus for long words', sv: 'Bonus för långa ord' }, lang),
        body: pick({
          en: '4 letters: +3 · 5: +6 · 6: +9 · 7: +12 · 8+: huge multipliers!',
          sv: '4 bokstäver: +3 · 5: +6 · 6: +9 · 7: +12 · 8+: enorma multiplikatorer!',
        }, lang),
      },
    ],
  },
  'mode-surge': {
    id: 'mode-surge',
    steps: (lang) => [
      {
        title: pick({ en: 'Word Surge', sv: 'Word Surge' }, lang),
        body: pick({
          en: 'Long or high-scoring words give EXTRA moves. ≥10 pts → +10, ≥15 → +25. Long words add even more.',
          sv: 'Långa eller högpoängsord ger EXTRA drag. ≥10 p → +10, ≥15 → +25. Långa ord ger ännu fler.',
        }, lang),
      },
    ],
  },
  'mode-fiveplus': {
    id: 'mode-fiveplus',
    steps: (lang) => [
      {
        title: pick({ en: '5+ letters only', sv: 'Endast 5+ bokstäver' }, lang),
        body: pick({
          en: 'Only words with 5 or more letters count here. The board uses just three colors so longer rows are possible.',
          sv: 'Bara ord med 5 eller fler bokstäver räknas. Brädet har bara tre färger så längre rader blir möjliga.',
        }, lang),
      },
    ],
  },
  'mode-oneword': {
    id: 'mode-oneword',
    steps: (lang) => [
      {
        title: pick({ en: 'Best word wins', sv: 'Bästa ordet räknas' }, lang),
        body: pick({
          en: 'Find as many words as you like — but only your single highest-scoring word counts at the end!',
          sv: 'Hitta så många ord du vill — men bara ditt högst poängsatta ord räknas i slutet!',
        }, lang),
      },
    ],
  },
  'mode-bomb': {
    id: 'mode-bomb',
    steps: (lang) => [
      {
        title: pick({ en: 'Bombs are ticking', sv: 'Bomberna tickar' }, lang),
        body: pick({
          en: 'Bombs sit on vowels with a countdown. Each move ticks them down by 1. Pop a bomb by using its letter in a word — if any bomb hits 0, the round ends!',
          sv: 'Bomber sitter på vokaler med en nedräkning. Varje drag tickar ner dem med 1. Poppa en bomb genom att ha med dess bokstav i ett ord — når någon bomb 0 är rundan slut!',
        }, lang),
      },
    ],
  },
  'infection': {
    id: 'infection',
    steps: (lang) => [
      {
        title: pick({ en: 'A strange infection!', sv: 'En märklig smitta!' }, lang),
        body: pick({
          en: 'A purple bubble is infected. Every 10 moves it infects a neighbour. After 15 moves it dies and turns into a GHOST: it cannot be moved, but you can still combine it into words.',
          sv: 'En lila bubbla är smittad. Var 10:e drag smittar den en granne. Efter 15 drag dör den och blir ett SPÖKE: det går inte att flytta, men kan fortfarande ingå i ord.',
        }, lang),
        visual: <InfectionVisual />,
      },
      {
        title: pick({ en: 'Cure it', sv: 'Bota smittan' }, lang),
        body: pick({
          en: 'Pop infected bubbles by including them in a word — that cleanses them. A new infection will appear elsewhere.',
          sv: 'Poppa smittade bubblor genom att ha med dem i ett ord — då rensas de. En ny smitta dyker upp någon annanstans.',
        }, lang),
      },
    ],
  },
  'hidden-word': {
    id: 'hidden-word',
    steps: (lang) => [
      {
        title: pick({ en: 'A hidden word!', sv: 'Ett dolt ord!' }, lang),
        body: pick({
          en: 'Find the themed words shown above the board. Each one you find reveals the next letter of the hidden word.',
          sv: 'Hitta tematiska ord som visas ovanför brädet. Varje ord du hittar avslöjar nästa bokstav i det dolda ordet.',
        }, lang),
        visual: <HiddenWordVisual revealed={2} word="KATT" />,
      },
      {
        title: pick({ en: 'Think you know it?', sv: 'Tror du att du vet?' }, lang),
        body: pick({
          en: 'You don\'t have to wait for every letter — if you can guess the hidden word, just form it on the board to win.',
          sv: 'Du behöver inte vänta på varje bokstav — om du tror du vet ordet kan du gissa genom att bilda det på brädet.',
        }, lang),
      },
    ],
  },
  'two-hidden-words': {
    id: 'two-hidden-words',
    steps: (lang) => [
      {
        title: pick({ en: 'Two hidden words', sv: 'Två dolda ord' }, lang),
        body: pick({
          en: 'This time TWO words are hidden. Themed words first reveal the letters of word 1, then word 2. Form BOTH on the board to win — and yes, you can guess them once you think you know.',
          sv: 'Den här gången är TVÅ ord dolda. Tematiska ord avslöjar först bokstäverna i ord 1, sedan ord 2. Bilda BÅDA på brädet för att vinna — och ja, du får gissa dem så fort du tror du vet.',
        }, lang),
      },
    ],
  },
  'antigravity': {
    id: 'antigravity',
    steps: (lang) => [
      {
        title: pick({ en: 'Antigravity!', sv: 'Antigravitation!' }, lang),
        body: pick({
          en: 'Bubbles fall UPWARD here. New bubbles appear from below. Plan your swaps with the new direction in mind.',
          sv: 'Bubblorna faller UPPÅT här. Nya bubblor dyker upp underifrån. Planera dina byten utifrån den nya riktningen.',
        }, lang),
        visual: <AntigravityVisual />,
      },
    ],
  },
  'asteroids': {
    id: 'asteroids',
    steps: (lang) => [
      {
        title: pick({ en: 'Asteroids in the way', sv: 'Asteroider i vägen' }, lang),
        body: pick({
          en: 'Asteroids cannot be moved or popped. Pop bubbles BELOW them and they fall a step. Drop them all the way to the bottom row to destroy them.',
          sv: 'Asteroider kan inte flyttas eller poppas. Poppa bubblor UNDER dem så faller de ett steg. Få ner dem till nedersta raden för att förstöra dem.',
        }, lang),
        visual: <AsteroidVisual />,
      },
    ],
  },
  'satellite': {
    id: 'satellite',
    steps: (lang) => [
      {
        title: pick({ en: 'Satellite in orbit', sv: 'Satellit i omloppsbana' }, lang),
        body: pick({
          en: 'A satellite hovers in the middle and cannot be moved. Every 5 moves it charges a LASER — tap any bubble to swap its letter for a new one.',
          sv: 'En satellit svävar i mitten och går inte att flytta. Var 5:e drag laddar den en LASER — tryck på en valfri bubbla för att byta ut dess bokstav.',
        }, lang),
        visual: <SatelliteVisual />,
      },
    ],
  },
  'ufos': {
    id: 'ufos',
    steps: (lang) => [
      {
        title: pick({ en: 'Mischievous UFOs', sv: 'Busiga UFOs' }, lang),
        body: pick({
          en: 'UFOs are immovable. Every move they swap the bubble directly below them for a fresh one — so plan around their constant meddling.',
          sv: 'UFOs går inte att flytta. Varje drag byter de ut bubblan direkt under sig mot en ny — så planera runt deras ständiga pillande.',
        }, lang),
        visual: <UfoVisual />,
      },
    ],
  },
  'collapsing-cave': {
    id: 'collapsing-cave',
    steps: (lang) => [
      {
        title: pick({ en: 'The cave is collapsing!', sv: 'Grottan rasar!' }, lang),
        body: pick({
          en: 'From move 5, rocks start falling from above and lock in place. Score fast before the board fills up!',
          sv: 'Från drag 5 börjar stenar falla från ovan och låsa sig på plats. Få ihop poäng snabbt innan brädet fylls!',
        }, lang),
        visual: <CaveVisual />,
      },
    ],
  },
  'free-rockets': {
    id: 'free-rockets',
    steps: (lang) => [
      {
        title: pick({ en: 'Free rockets!', sv: 'Gratisraketer!' }, lang),
        body: pick({
          en: 'You start with rockets. Tap the rocket button, then a column — it fires straight up and pops every bubble in that column.',
          sv: 'Du startar med raketer. Tryck på raketknappen och välj en kolumn — den skjuter rakt upp och spräcker alla bubblor i den kolumnen.',
        }, lang),
        visual: <RocketVisual />,
      },
    ],
  },
  'start-powerups': {
    id: 'start-powerups',
    steps: (lang) => [
      {
        title: pick({ en: 'Powerups in your bag', sv: 'Powerups i väskan' }, lang),
        body: pick({
          en: 'You start this level with helper powerups. Use them anytime: swap two letters, or recolor a bubble. They reset every time you restart this level.',
          sv: 'Du startar nivån med hjälp-powerups. Använd dem när du vill: byt två bokstäver, eller ändra färg på en bubbla. De återställs varje gång du startar om nivån.',
        }, lang),
        visual: <PowerupSwapVisual />,
      },
    ],
  },
};

// ─── derive concepts a level needs ───────────────────────────────────────
export function getLevelConcepts(level: AdventureLevel): ConceptId[] {
  const out: ConceptId[] = [];
  const mode = level.mode ?? 'classic';
  out.push(`mode-${mode}` as ConceptId);
  if (level.goal.type === 'hidden-word') out.push('hidden-word');
  if (level.goal.type === 'two-hidden-words') out.push('two-hidden-words');
  if (level.antigravity) out.push('antigravity');
  if (level.asteroids) out.push('asteroids');
  if (level.satellite) out.push('satellite');
  if (level.ufos) out.push('ufos');
  if (level.collapsingCave) out.push('collapsing-cave');
  if (level.infection) out.push('infection');
  if ((level.freeRockets ?? 0) > 0) out.push('free-rockets');
  if (level.startPowerups && level.startPowerups.length > 0) out.push('start-powerups');
  return out;
}

export function getConceptSteps(id: string, lang: GameLanguage): TutorialStep[] {
  const def = CONCEPTS[id as ConceptId];
  return def ? def.steps(lang) : [];
}
