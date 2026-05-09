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
    surge: { icon: <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />, label: t.modeSurge, color: 'rgba(15, 23, 42, 0.8)', border: 'rgba(234,179,8,0.4)' },
    fiveplus: { icon: <Hash className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />, label: t.modeFiveplus, color: 'rgba(15, 23, 42, 0.8)', border: 'rgba(34,211,238,0.4)' },
    bomb: { icon: <Bomb className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />, label: t.modeBomb, color: 'rgba(15, 23, 42, 0.8)', border: 'rgba(239,68,68,0.4)' },
    oneword: { icon: <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />, label: t.modeOneword, color: 'rgba(15, 23, 42, 0.8)', border: 'rgba(16,185,129,0.4)' },
  };

  const badge = MODE_BADGE[mode];

  // Gemensam stil för statistik-rutorna
  const statsBoxClass = "flex-1 rounded-2xl py-4 px-2 md:p-4 text-center bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg transition-all";

  return (
    <div className="flex flex-col gap-1.5 md:gap-3 w-full px-0 md:px-0">
      {/* Mode badge */}
      {!hideBadge && badge && (
        <div className="flex items-center justify-center gap-2 rounded-full py-1 px-4 self-center backdrop-blur-md shadow-lg" style={{ background: badge.color, border: `1px solid ${badge.border}` }}>
          {badge.icon}
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white">{badge.label}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-2 md:gap-3">
        {isOneWord ? (
          <>
            <div className={statsBoxClass}>
              <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/50 mb-1">{t.bestWord}</div>
              <div className="text-3xl font-black text-emerald-400 drop-shadow-sm">{bestWordScore}</div>
              {bestWord && <div className="text-xs font-medium text-white/40 mt-1 uppercase tracking-tighter">{bestWord}</div>}
            </div>
            <div className={statsBoxClass}>
              <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/50 mb-1">{t.movesLeft}</div>
              <div className={`text-3xl font-black drop-shadow-sm ${movesLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{movesLeft}</div>
            </div>
          </>
        ) : (
          <>
            <div className={statsBoxClass}>
              <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/50 mb-1">{t.score}</div>
              <div className="text-3xl font-black text-white drop-shadow-sm">{score}</div>
            </div>
            {!isBomb && (
              <div className={statsBoxClass}>
                <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/50 mb-1">{t.movesLeft}</div>
                <div className={`text-3xl font-black drop-shadow-sm ${movesLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{movesLeft}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bomb mode: free-moves shield indicator */}
      {isBomb && freeMovesRemaining > 0 && (
        <div className="rounded-xl py-2 px-4 text-center self-center flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 shadow-lg">
          <span className="text-base">🛡️</span>
          <span className="text-sm md:text-base font-bold text-emerald-300 uppercase tracking-wide">
            {freeMovesRemaining} {t.movesLeft.toLowerCase()}
          </span>
        </div>
      )}

      {/* Word found toast */}
      {lastFoundWord && (
        <div className="rounded-2xl p-3 text-center animate-in zoom-in duration-300 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 shadow-xl">
          <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-300/70">{t.wordFound}</div>
          <div className="text-xl md:text-2xl font-black tracking-[0.2em] text-emerald-300 uppercase">{lastFoundWord}</div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 md:gap-3 mt-1">
        <Button 
          onClick={onShowWords} 
          className="flex-1 gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800 h-14 md:h-12 text-sm font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          <List className="w-5 h-5 text-white/50" /> 
          <span className="uppercase tracking-tight">{t.words}</span>
          <span className="bg-white/10 px-2 py-0.5 rounded-lg text-xs font-black">{usedWordsCount}{blockedWordsCount > 0 ? `+${blockedWordsCount}` : ''}</span>
        </Button>
        
        <Button 
          onClick={onResetGame} 
          className="w-14 h-14 md:w-12 md:h-12 bg-slate-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800 p-0 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
