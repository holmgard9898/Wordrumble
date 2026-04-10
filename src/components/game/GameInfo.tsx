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
  blockedWordsCount?: number;
  mode: GameMode;
  bestWordScore?: number;
  bestWord?: string | null;
}

const MODE_BADGE: Record<GameMode, { icon: React.ReactNode; label: string; color: string; border: string } | null> = {
  classic: null,
  surge: { icon: <Zap className="w-4 h-4 text-yellow-400" />, label: 'Word Surge', color: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.3)' },
  fiveplus: { icon: <Hash className="w-4 h-4 text-cyan-400" />, label: '5+ Bokstäver', color: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.3)' },
  bomb: { icon: <Bomb className="w-4 h-4 text-red-400" />, label: 'Bomb Mode', color: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.3)' },
  oneword: { icon: <Target className="w-4 h-4 text-emerald-400" />, label: 'Ett Ord', color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)' },
};

export function GameInfo({
  movesLeft, score, lastFoundWord,
  onResetGame, onShowWords, usedWordsCount, blockedWordsCount = 0, mode,
  bestWordScore = 0, bestWord,
}: GameInfoProps) {
  const badge = MODE_BADGE[mode];
  const isBomb = mode === 'bomb';
  const isOneWord = mode === 'oneword';

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {badge && (
        <div className="flex items-center justify-center gap-2 rounded-lg py-1 px-3 self-center" style={{ background: badge.color, border: `1px solid ${badge.border}` }}>
          {badge.icon}
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: badge.border.replace('0.3', '1') }}>{badge.label}</span>
        </div>
      )}

      <div className="flex gap-3">
        {isOneWord ? (
          <>
            <div className="flex-1 rounded-xl p-3 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">Bästa ord</div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400">{bestWordScore}</div>
              {bestWord && <div className="text-xs text-white/50 mt-1">{bestWord}</div>}
            </div>
            <div className="flex-1 rounded-xl p-3 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">Drag kvar</div>
              <div className={`text-2xl md:text-3xl font-bold ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                {movesLeft}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 rounded-xl p-3 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">Poäng</div>
              <div className="text-2xl md:text-3xl font-bold text-white">{score}</div>
            </div>
            {!isBomb && (
              <div className="flex-1 rounded-xl p-3 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">Drag kvar</div>
                <div className={`text-2xl md:text-3xl font-bold ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                  {movesLeft}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {lastFoundWord && (
        <div className="rounded-xl p-2 md:p-3 text-center animate-pulse" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}>
          <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-green-300 mb-1">Ord hittat!</div>
          <div className="text-xl md:text-2xl font-bold tracking-widest text-green-300">{lastFoundWord}</div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onShowWords}
          variant="outline"
          className="flex-1 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
        >
          <List className="w-4 h-4" /> Ord ({usedWordsCount}{blockedWordsCount > 0 ? `+${blockedWordsCount}` : ''})
        </Button>
        <Button
          onClick={onResetGame}
          variant="outline"
          className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
