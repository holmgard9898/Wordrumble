import { Button } from '@/components/ui/button';
import { RotateCcw, List, Zap, Bomb, Hash, Target } from 'lucide-react';
import type { GameMode } from '@/pages/GamePage';

interface GameInfoProps {
  movesLeft: number;
  score: number;
  lastFoundWord: string | null;
  onResetGame: () => void;
  onShowWords: () => void;
  usedWordsCount: number;
  mode: GameMode;
  bestWordScore?: number;
  bestWord?: string | null;
  hideReset?: boolean;
}

const MODE_BADGE: Record<GameMode, { icon: React.ReactNode; label: string; color: string; border: string } | null> = {
  classic: null,
  surge: { icon: <Zap className="w-4 h-4 text-yellow-400" />, label: 'Word Surge', color: 'hsl(48 96% 53% / 0.18)', border: 'hsl(48 96% 53% / 0.35)' },
  fiveplus: { icon: <Hash className="w-4 h-4 text-cyan-400" />, label: '5+ Bokstäver', color: 'hsl(189 94% 43% / 0.18)', border: 'hsl(189 94% 43% / 0.35)' },
  bomb: { icon: <Bomb className="w-4 h-4 text-red-400" />, label: 'Bomb Mode', color: 'hsl(0 84% 60% / 0.18)', border: 'hsl(0 84% 60% / 0.35)' },
  oneword: { icon: <Target className="w-4 h-4 text-emerald-400" />, label: 'Ett Ord', color: 'hsl(160 84% 39% / 0.18)', border: 'hsl(160 84% 39% / 0.35)' },
};

export function GameInfo({
  movesLeft,
  score,
  lastFoundWord,
  onResetGame,
  onShowWords,
  usedWordsCount,
  mode,
  bestWordScore = 0,
  bestWord,
  hideReset = false,
}: GameInfoProps) {
  const badge = MODE_BADGE[mode];
  const isBomb = mode === 'bomb';
  const isOneWord = mode === 'oneword';

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {badge && (
        <div className="self-center rounded-lg px-3 py-1" style={{ background: badge.color, border: `1px solid ${badge.border}` }}>
          <div className="flex items-center justify-center gap-2">
            {badge.icon}
            <span className="text-xs font-semibold uppercase tracking-wider text-white">{badge.label}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {isOneWord ? (
          <>
            <div className="flex-1 rounded-xl bg-black/30 p-3 text-center md:p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/70 md:text-xs">Bästa ord</div>
              <div className="text-2xl font-bold text-emerald-400 md:text-3xl">{bestWordScore}</div>
              {bestWord ? <div className="mt-1 text-xs text-white/50">{bestWord}</div> : null}
            </div>
            <div className="flex-1 rounded-xl bg-black/30 p-3 text-center md:p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/70 md:text-xs">Drag kvar</div>
              <div className={`text-2xl font-bold md:text-3xl ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{movesLeft}</div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 rounded-xl bg-black/30 p-3 text-center md:p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/70 md:text-xs">Poäng</div>
              <div className="text-2xl font-bold text-white md:text-3xl">{score}</div>
            </div>
            {!isBomb ? (
              <div className="flex-1 rounded-xl bg-black/30 p-3 text-center md:p-4">
                <div className="text-[10px] uppercase tracking-wider text-white/70 md:text-xs">Drag kvar</div>
                <div className={`text-2xl font-bold md:text-3xl ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{movesLeft}</div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {lastFoundWord ? (
        <div className="animate-pulse rounded-xl border border-emerald-400/40 bg-emerald-400/15 p-2 text-center md:p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-emerald-300/80 md:text-xs">Ord hittat!</div>
          <div className="text-xl font-bold tracking-widest text-emerald-300 md:text-2xl">{lastFoundWord}</div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button onClick={onShowWords} variant="outline" className="flex-1 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
          <List className="w-4 h-4" /> Ord ({usedWordsCount})
        </Button>
        {!hideReset ? (
          <Button onClick={onResetGame} variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
            <RotateCcw className="w-4 h-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
