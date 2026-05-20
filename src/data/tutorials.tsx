import React from 'react';
import type { TutorialStep } from '@/components/TutorialModal';
import type { GameLanguage } from './languages';
import type { GameMode } from '@/pages/GamePage';
import { InteractiveSwapDemo } from '@/components/tutorial/InteractiveSwapDemo';

// Short, simple words used in the interactive swipe tutorial — one per language.
const DEMO_WORDS: Record<GameLanguage, string> = {
  en: 'CAT',
  sv: 'KATT',
  de: 'HUND',
  es: 'GATO',
  fr: 'CHAT',
  it: 'GATO',
  pt: 'GATO',
  nl: 'KAT',
  no: 'KATT',
  da: 'KAT',
  fi: 'KISA',
};

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

const BombVisual: React.FC = () => (
  <div className="grid grid-cols-3 gap-1.5">
    {['C', 'A', 'T', 'O', '💣', 'P', 'S', 'U', 'N'].map((ch, i) => {
      const isBomb = ch === '💣';
      return (
        <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
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

// Pro-Tip visual: a star/lightbulb header treatment rendered inside the step body.
const ProTipBody: React.FC<{ header: string; body: string; tipLabel: string }> = ({ header, body, tipLabel }) => (
  <div className="rounded-2xl p-4 text-left"
       style={{ background: 'linear-gradient(135deg, rgba(253,224,71,0.18), rgba(236,72,153,0.18))', border: '1px solid rgba(253,224,71,0.35)' }}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-yellow-300 text-xl">💡</span>
      <span className="text-yellow-200 text-[11px] font-bold uppercase tracking-widest">{tipLabel}</span>
    </div>
    <div className="text-white font-extrabold text-base leading-snug mb-1">{header}</div>
    <div className="text-white/85 text-sm leading-relaxed whitespace-pre-line">{body}</div>
  </div>
);

type L = Record<GameLanguage, string>;
const L = (en: string, sv: string): L => ({
  en, sv, de: en, es: en, fr: en, it: en, pt: en, nl: en, no: sv, da: sv, fi: en,
});

function tip(lang: GameLanguage, header: { en: string; sv: string }, body: { en: string; sv: string }): TutorialStep {
  const tipLabel = lang === 'sv' ? 'Proffstips' : 'Pro-Tip';
  const h = L(header.en, header.sv)[lang];
  const b = L(body.en, body.sv)[lang];
  return {
    title: tipLabel,
    body: '',
    visual: <ProTipBody header={h} body={b} tipLabel={tipLabel} />,
  };
}

/** Generic swipe-up swap demo, used only the first time the player ever plays
 *  (Classic mode or Adventure level 1). */
export function getGenericSwipeSteps(lang: GameLanguage): TutorialStep[] {
  const t = (en: string, sv: string) => L(en, sv)[lang];
  const demoWord = DEMO_WORDS[lang] ?? DEMO_WORDS.en;
  return [
    {
      title: t('Swap bubbles', 'Byt bubblor'),
      body: t(
        'Tap two adjacent bubbles to swap them. Plan swaps so bubbles of the SAME color line up to spell a word.',
        'Tryck på två bubblor bredvid varandra för att byta plats. Planera bytena så att bubblor med SAMMA färg hamnar i rad och bildar ett ord.'
      ),
      visual: <SwapVisual />,
    },
    {
      title: t('Same color forms words', 'Samma färg bildar ord'),
      body: t(
        `Bubbles of the SAME color in a row spell a word. Try it: swipe to spell ${demoWord}!`,
        `Bubblor med SAMMA färg i rad bildar ett ord. Prova själv: swipa för att stava ${demoWord}!`,
      ),
      interactive: true,
      renderVisual: ({ done }) => <InteractiveSwapDemo word={demoWord} onComplete={done} />,
    },
  ];
}

export interface ModeTutorialOpts {
  /** When true, prepends the generic swap + swipe demo steps. */
  includeGenericSwipe?: boolean;
}

export function getTutorialSteps(mode: GameMode, lang: GameLanguage, opts: ModeTutorialOpts = {}): TutorialStep[] {
  const t = (en: string, sv: string) => L(en, sv)[lang];

  const generic = opts.includeGenericSwipe ? getGenericSwipeSteps(lang) : [];

  switch (mode) {
    case 'classic':
      return [
        ...generic,
        {
          title: t('Classic Mode', 'Klassiskt läge'),
          body: t(
            'You have 50 moves. Find as many words as possible — every word adds to your score.',
            'Du har 50 drag. Hitta så många ord du kan — varje ord ökar din poäng.'
          ),
        },
        {
          title: t('Length bonus', 'Längdbonus'),
          body: t(
            '4 letters: +3 pts\n5 letters: +6 pts\n6 letters: +9 pts\n7 letters: +12 pts\n8+ letters: huge multipliers (×2, ×3, ×4)!',
            '4 bokstäver: +3 p\n5 bokstäver: +6 p\n6 bokstäver: +9 p\n7 bokstäver: +12 p\n8+ bokstäver: enorma multiplikatorer (×2, ×3, ×4)!'
          ),
        },
        tip(lang,
          { en: 'Mix Short and Long Words!', sv: 'Blanda korta och långa ord!' },
          {
            en: 'Stringing together lots of small words is a reliable way to keep your score climbing and your moves spent productively. But whenever the board lines up for it, build a long word — the length bonus is a huge score boost. Long words usually take more moves to set up, so weigh the cost against the payoff.',
            sv: 'Att hitta många små ord är ett pålitligt sätt att hålla poängen uppe och använda dragen effektivt. Men så fort brädet ger dig chansen — bygg ett långt ord. Längdbonusen är en enorm poängskjuts. Långa ord kräver oftast fler drag att förbereda, så väg kostnaden mot belöningen.',
          },
        ),
      ];

    case 'surge': {
      const surgeExample = lang === 'sv'
        ? 'Ordet "TAX" ger 10 poäng och därmed +10 extra drag — du tjänar fler drag än du använt!'
        : 'A short word like "ZAP" or "QI" can hit 10+ points, giving you +10 extra moves — more moves earned than spent!';
      return [
        ...generic,
        {
          title: t('Word Surge', 'Word Surge'),
          body: t(
            'No move limit — instead, every word you find earns extra moves. The game ends only when you run out of moves.',
            'Ingen draggräns — istället ger varje ord du hittar extra drag. Spelet tar slut först när dragen tar slut.'
          ),
        },
        {
          title: t('Earn extra moves', 'Tjäna extra drag'),
          body: t(
            'High-scoring words give moves:\n≥10 pts → +10 moves\n≥15 pts → +25 moves\nLong words too: 5+ letters → +10, 7+ → +25, 10 → +50.',
            'Högpoängsord ger drag:\n≥10 p → +10 drag\n≥15 p → +25 drag\nLånga ord också: 5+ bokstäver → +10, 7+ → +25, 10 → +50.'
          ),
        },
        tip(lang,
          { en: 'Short Words with Rare Letters are King!', sv: 'Korta ord med sällsynta bokstäver är kung!' },
          {
            en: `Short words built from rare letters like Z, Q, X or J are incredibly powerful here. ${surgeExample}\n\nAnd long words are even better than in Classic — they don't grant the usual length score bonus, but they typically reward you with more moves than it took to construct them, so you net moves on every chain.`,
            sv: `Korta ord med sällsynta bokstäver som X, Y, Z eller Q är otroligt kraftfulla här. ${surgeExample}\n\nLånga ord är dessutom ännu bättre än i klassiskt läge — de ger ingen traditionell längdbonus i poäng, men brukar belöna dig med fler drag än det kostade att bygga dem, så du går alltid plus.`,
          },
        ),
      ];
    }

    case 'fiveplus':
      return [
        ...generic,
        {
          title: t('5+ Letter Mode', '5+ bokstäver'),
          body: t(
            'The board uses only 3 colors so longer rows are possible. Only words with 5 letters or more count. You have 100 moves.',
            'Brädet använder bara 3 färger så längre rader är möjliga. Bara ord med 5 eller fler bokstäver räknas. Du har 100 drag.'
          ),
          visual: <MiniGrid colors={['#EF4444', '#22C55E', '#3B82F6']} />,
        },
        {
          title: t('Length bonus', 'Längdbonus'),
          body: t(
            '5 letters: +6 pts\n6 letters: +9 pts\n7 letters: +12 pts\n8+ letters: huge multipliers (×2, ×3, ×4)!',
            '5 bokstäver: +6 p\n6 bokstäver: +9 p\n7 bokstäver: +12 p\n8+ bokstäver: enorma multiplikatorer (×2, ×3, ×4)!'
          ),
        },
        tip(lang,
          { en: 'Plan Long Lanes, Not Quick Wins!', sv: 'Planera långa banor, inte snabba vinster!' },
          {
            en: 'With only 3 colors and a 5-letter minimum, the board is built for long words. Spend a few extra moves to line up a 7- or 8-letter combo instead of settling for the first 5-letter word you spot — the multiplier on the long word often beats two short ones combined.',
            sv: 'Med bara 3 färger och 5-bokstäversminimum är brädet byggt för långa ord. Lägg några extra drag på att bygga ett 7- eller 8-bokstavskombo istället för att nöja dig med det första 5-bokstavsordet — multiplikatorn på det långa ordet slår ofta två korta tillsammans.',
          },
        ),
      ];

    case 'oneword':
      return [
        ...generic,
        {
          title: t('One Word Mode', 'Ett ord'),
          body: t(
            'You have 60 moves. Find as many words as you want — but only your single highest-scoring word counts at the end!',
            'Du har 60 drag. Hitta så många ord du vill — men bara ditt högst poängsatta ord räknas i slutet!'
          ),
        },
        {
          title: t('Length bonus', 'Längdbonus'),
          body: t(
            '4 letters: +3 pts\n5 letters: +6 pts\n6 letters: +9 pts\n7 letters: +12 pts\n8+ letters: huge multipliers (×2, ×3, ×4)!',
            '4 bokstäver: +3 p\n5 bokstäver: +6 p\n6 bokstäver: +9 p\n7 bokstäver: +12 p\n8+ bokstäver: enorma multiplikatorer (×2, ×3, ×4)!'
          ),
        },
        tip(lang,
          { en: 'Sacrifice Moves for One Mega Word!', sv: 'Offra drag för ett megaord!' },
          {
            en: "Only your best word matters, so don't be afraid to burn 20+ moves setting up one massive 8- or 9-letter play. A single ×3 multiplier on a long, rare-letter word will out-score a dozen safe 4-letter words combined.",
            sv: 'Bara ditt bästa ord räknas, så var inte rädd att bränna 20+ drag på att bygga ett enda massivt 8- eller 9-bokstavsord. En enda ×3-multiplikator på ett långt ord med sällsynta bokstäver slår ett dussin trygga 4-bokstavsord tillsammans.',
          },
        ),
      ];

    case 'bomb':
      return [
        ...generic,
        {
          title: t('Bomb Mode', 'Bombläge'),
          body: t(
            'Bombs spawn on vowels with a countdown timer. Every move ticks every bomb down by 1.',
            'Bomber dyker upp på vokaler med en nedräkningstimer. Varje drag minskar varje bomb med 1.'
          ),
          visual: <BombVisual />,
        },
        {
          title: t('Defuse bombs', 'Desarmera bomber'),
          body: t(
            "Pop a bomb by using its letter in a word. If any bomb hits 0, the game ends!\n\n×2 / ×3 multipliers boost scores. FREE5 gives 5 safe moves where bombs don't tick.",
            'Poppa en bomb genom att använda dess bokstav i ett ord. Når någon bomb 0 är spelet slut!\n\n×2 / ×3 multiplikatorer ökar poängen. FREE5 ger 5 säkra drag där bomber inte tickar.'
          ),
        },
        tip(lang,
          { en: 'Defuse Early, Plan Ahead!', sv: 'Desarmera tidigt, planera framåt!' },
          {
            en: "Bombs always land on vowels — and vowels are exactly the letters you need for almost every word. Don't ignore a fresh bomb just because its timer is high; defuse it the next time its vowel is convenient. Save your FREE5 for moments where you need 2–3 extra setup moves to land a long, high-scoring word that also pops several bombs at once.",
            sv: 'Bomber landar alltid på vokaler — och vokaler är precis det du behöver för nästan alla ord. Ignorera inte en ny bomb bara för att timern är hög; desarmera den nästa gång dess vokal passar. Spara FREE5 till tillfällen då du behöver 2–3 extra drag för att lägga ett långt högpoängsord som också poppar flera bomber på en gång.',
          },
        ),
      ];

    default:
      return generic;
  }
}
