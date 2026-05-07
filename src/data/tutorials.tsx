import React from 'react';
import type { TutorialStep } from '@/components/TutorialModal';
import type { GameLanguage } from './languages';
import type { GameMode } from '@/pages/GamePage';

// Visual: mini bubble grid demo
const MiniGrid: React.FC<{ highlight?: [number, number][]; highlightColor?: string; word?: string; colors?: string[] }> = ({
  highlight = [],
  highlightColor = '#22C55E',
  word,
  colors = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7'],
}) => {
  const grid = [
    ['C', 'A', 'T', 'B'],
    ['O', 'R', 'E', 'L'],
    ['S', 'U', 'N', 'M'],
    ['P', 'L', 'A', 'Y'],
  ];
  const isHi = (r: number, c: number) => highlight.some(([hr, hc]) => hr === r && hc === c);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-4 gap-1.5">
        {grid.map((row, r) =>
          row.map((ch, c) => {
            const hi = isHi(r, c);
            const color = hi ? highlightColor : colors[(r + c) % colors.length];
            return (
              <div
                key={`${r}-${c}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all ${hi ? 'ring-2 ring-yellow-300 scale-110' : ''}`}
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${color}ee, ${color}aa)`,
                  boxShadow: hi
                    ? '0 0 12px rgba(253,224,71,0.8), inset 0 -2px 4px rgba(0,0,0,0.2)'
                    : 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {ch}
              </div>
            );
          })
        )}
      </div>
      {word && (
        <div className="text-yellow-300 font-bold text-lg tracking-wider mt-1" style={{ textShadow: '0 0 8px rgba(253,224,71,0.6)' }}>
          {word}
        </div>
      )}
    </div>
  );
};

// Visual: arrows showing swap
const SwapVisual: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
         style={{ background: 'radial-gradient(circle at 30% 30%, #3B82F6ee, #1E40AFcc)', boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.25)' }}>
      A
    </div>
    <div className="text-yellow-300 text-2xl">⇄</div>
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
         style={{ background: 'radial-gradient(circle at 30% 30%, #EF4444ee, #991B1Bcc)', boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.25)' }}>
      B
    </div>
  </div>
);

// Bomb visual
const BombVisual: React.FC = () => (
  <div className="grid grid-cols-3 gap-1.5">
    {['C', 'A', 'T', 'O', '💣', 'P', 'S', 'U', 'N'].map((ch, i) => {
      const isBomb = ch === '💣';
      return (
        <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm`}
             style={{
               background: isBomb
                 ? 'radial-gradient(circle, #1f1f1f, #000)'
                 : `radial-gradient(circle at 30% 30%, hsl(${i * 40},70%,55%)ee, hsl(${i * 40},70%,40%)cc)`,
               color: 'white',
               boxShadow: isBomb ? '0 0 14px rgba(239,68,68,0.7)' : 'inset 0 -2px 4px rgba(0,0,0,0.2)',
             }}>
          {isBomb ? '💣' : ch}
        </div>
      );
    })}
  </div>
);

// ─── i18n ────────────────────────────────────────────────────────────────
type L = Record<GameLanguage, string>;
const L = (en: string, sv: string): L => ({
  en, sv, de: en, es: en, fr: en, it: en, pt: en, nl: en, no: sv, da: sv, fi: en,
});

const COMMON: TutorialStep[] = []; // placeholder, replaced below per-language

export function getTutorialSteps(mode: GameMode, lang: GameLanguage): TutorialStep[] {
  const t = (en: string, sv: string) => L(en, sv)[lang];

  const swap: TutorialStep = {
    title: t('Swap bubbles', 'Byt bubblor'),
    body: t(
      'Tap two adjacent bubbles to swap them. Build words by lining up letters in a row or column.',
      'Tryck på två bubblor bredvid varandra för att byta plats. Bilda ord genom att radera bokstäver i en rad eller kolumn.'
    ),
    visual: <SwapVisual />,
  };

  const findWords: TutorialStep = {
    title: t('Form words', 'Bilda ord'),
    body: t(
      'When 3+ letters in a row or column form a valid word, they pop and you score points!',
      'När 3+ bokstäver i rad eller kolumn bildar ett giltigt ord poppar de och du får poäng!'
    ),
    visual: <MiniGrid highlight={[[0, 0], [0, 1], [0, 2]]} word="CAT" />,
  };

  const lengthBonus: TutorialStep = {
    title: t('Long word bonus', 'Bonus för långa ord'),
    body: t(
      '4 letters: +3 pts\n5 letters: +6 pts\n6 letters: +9 pts\n7 letters: +12 pts\n8+ letters: huge multipliers (×2, ×3, ×4)!',
      '4 bokstäver: +3 p\n5 bokstäver: +6 p\n6 bokstäver: +9 p\n7 bokstäver: +12 p\n8+ bokstäver: enorma multiplikatorer (×2, ×3, ×4)!'
    ),
  };

  switch (mode) {
    case 'classic':
      return [
        swap,
        findWords,
        lengthBonus,
        {
          title: t('50 moves', '50 drag'),
          body: t(
            'You have 50 swaps. Score as many points as possible before they run out!',
            'Du har 50 byten. Få så många poäng som möjligt innan de tar slut!'
          ),
        },
      ];
    case 'surge':
      return [
        swap,
        findWords,
        {
          title: t('Earn extra moves', 'Tjäna extra drag'),
          body: t(
            'High-scoring words give extra moves:\n≥10 pts → +10 moves\n≥15 pts → +25 moves\nLong words also give bonuses (5+ letters → +10, 7+ → +25, 10 → +50).',
            'Högpoängsord ger extra drag:\n≥10 p → +10 drag\n≥15 p → +25 drag\nLånga ord ger också bonus (5+ bokstäver → +10, 7+ → +25, 10 → +50).'
          ),
        },
        {
          title: t('No length points', 'Inga längdpoäng'),
          body: t('In Word Surge, long words give moves instead of bonus points.', 'I Word Surge ger långa ord drag istället för bonuspoäng.'),
        },
      ];
    case 'fiveplus':
      return [
        swap,
        {
          title: t('Only 3 colors', 'Bara 3 färger'),
          body: t('The board uses only red, green and blue — making longer rows possible.', 'Brädet använder bara rött, grönt och blått — vilket gör längre rader möjliga.'),
          visual: <MiniGrid colors={['#EF4444', '#22C55E', '#3B82F6']} />,
        },
        {
          title: t('5+ letters only', 'Endast 5+ bokstäver'),
          body: t('Only words with 5 or more letters count. You have 100 moves.', 'Endast ord med 5 eller fler bokstäver räknas. Du har 100 drag.'),
        },
        lengthBonus,
      ];
    case 'oneword':
      return [
        swap,
        findWords,
        {
          title: t('Best word wins', 'Bästa ordet vinner'),
          body: t(
            'You have 60 moves. Find as many words as you want — but only your single highest-scoring word counts at the end!',
            'Du har 60 drag. Hitta så många ord du vill — men bara ditt högst poängsatta ord räknas i slutet!'
          ),
        },
        lengthBonus,
      ];
    case 'bomb':
      return [
        swap,
        findWords,
        {
          title: t('Watch out for bombs', 'Akta dig för bomber'),
          body: t(
            'Bombs spawn on vowels with a countdown timer. Each move ticks them down by 1.',
            'Bomber dyker upp på vokaler med en nedräkningstimer. Varje drag minskar timern med 1.'
          ),
          visual: <BombVisual />,
        },
        {
          title: t('Defuse bombs', 'Desarmera bomber'),
          body: t(
            'Pop a bomb by including its letter in a word. If any bomb hits 0, the game ends!',
            'Poppa en bomb genom att inkludera dess bokstav i ett ord. Om en bomb når 0 är spelet slut!'
          ),
        },
        {
          title: t('Powerups', 'Powerups'),
          body: t(
            '×2 / ×3 multipliers boost your word score.\nFREE5 gives 5 safe moves where bombs don\'t tick.',
            '×2 / ×3 multiplikatorer ökar din ordpoäng.\nFREE5 ger 5 säkra drag där bomber inte tickar.'
          ),
        },
      ];
    default:
      return [swap, findWords, lengthBonus];
  }
}
