import { Button } from '@/components/ui/button';
import { RotateCcw, List, Zap, Bomb, Hash, Target } from 'lucide-react';
import type { GameMode } from '@/pages/GamePage';
import { useTranslation } from '@/hooks/useTranslation';

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
  hideBadge?: boolean;
  freeMovesRemaining?: number;
}

export function GameInfo({
  movesLeft, score, lastFoundWord,
  onResetGame, onShowWords, usedWordsCount, blockedWordsCount = 0, mode,
  bestWordScore = 0, bestWord, hideBadge = false, freeMovesRemaining = 0,
}: GameInfoProps) {
  const { t } = useTranslation();
  const isBomb = mode === 'bomb';
  const isOneWord = mode === 'oneword';

  const MODE_BADGE: Record<GameMode, { icon: React.ReactNode; label: string; color: string; border: string } | null> = {
    classic: null,
    surge: { icon: <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />, label: t.modeSurge, color: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.3)' },
    fiveplus: { icon: <Hash className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />, label: t.modeFiveplus, color: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.3)' },
    bomb: { icon: <Bomb className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />, label: t.modeBomb, color: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.3)' },
    oneword: { icon: <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />, label: t.modeOneword, color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)' },
  };

  const badge = MODE_BADGE[mode];

  return (
    <div className="flex flex-col gap-1.5 md:gap-3 w-full px-0 md:px-0">
      {/* Mode badge */}
      {!hideBadge && badge && (
        <div className="flex items-center justify-center gap-1.5 rounded-lg py-0.5 px-2.5 self-center" style={{ background: badge.color, border: `1px solid ${badge.border}` }}>
          {badge.icon}
          <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider" style={{ color: badge.border.replace('0.3', '1') }}>{badge.label}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-1.5 md:gap-3">
        {isOneWord ? (
          <>
            <div className="flex-1 rounded-lg md:rounded-xl py-4 px-2 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">{t.bestWord}</div>
              <div className="text-3xl md:text-3xl font-bold text-emerald-400">{bestWordScore}</div>
              {bestWord && <div className="text-xs md:text-xs text-white/50">{bestWord}</div>}
            </div>
            <div className="flex-1 rounded-lg md:rounded-xl py-4 px-2 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">{t.movesLeft}</div>
              <div className={`text-3xl md:text-3xl font-bold ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{movesLeft}</div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 rounded-lg md:rounded-xl py-4 px-2 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">{t.score}</div>
              <div className="text-3xl md:text-3xl font-bold text-white">{score}</div>
            </div>
            {!isBomb && (
              <div className="flex-1 rounded-lg md:rounded-xl py-4 px-2 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">{t.movesLeft}</div>
                <div className={`text-3xl md:text-3xl font-bold ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{movesLeft}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bomb mode: free-moves shield indicator */}
      {isBomb && freeMovesRemaining > 0 && (
        <div className="rounded-lg md:rounded-xl py-1.5 px-3 text-center self-center flex items-center gap-2"
          style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.45)' }}>
          <span className="text-base">🛡️</span>
          <span className="text-sm md:text-base font-bold text-green-300">
            {freeMovesRemaining} fri{freeMovesRemaining === 1 ? 'tt' : 'a'} drag
          </span>
        </div>
      )}

      {/* Word found toast */}
      {lastFoundWord && (
        <div className="rounded-lg md:rounded-xl p-2 md:p-3 text-center animate-pulse" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}>
          <div className="text-[9px] md:text-xs uppercase tracking-wider opacity-70 text-green-300">{t.wordFound}</div>
          <div className="text-lg md:text-2xl font-bold tracking-widest text-green-300">{lastFoundWord}</div>
        </div>
      )}

      {/* Action buttons — taller on mobile */}
      <div className="flex gap-1.5 md:gap-2">
        <Button onClick={onShowWords} variant="outline" size="sm" className="flex-1 gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 md:h-10 text-sm md:text-sm">
          <List className="w-4 h-4 md:w-4 md:h-4" /> {t.words} ({usedWordsCount}{blockedWordsCount > 0 ? `+${blockedWordsCount}` : ''})
        </Button>
        <Button onClick={onResetGame} variant="outline" size="sm" className="gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 w-12 md:h-10 p-0">
          <RotateCcw className="w-4 h-4 md:w-4 md:h-4" />
        </Button>
      </div>
    </div>
  );
}
