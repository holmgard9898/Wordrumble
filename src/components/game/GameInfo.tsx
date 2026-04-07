import { Button } from '@/components/ui/button';
import { RotateCcw, List, Zap } from 'lucide-react';
import type { GameMode } from '@/pages/GamePage';

interface GameInfoProps {
  movesLeft: number;
  score: number;
  gameOver: boolean;
  lastFoundWord: string | null;
  onResetGame: () => void;
  onShowWords: () => void;
  usedWordsCount: number;
  mode: GameMode;
}

export function GameInfo({
  movesLeft, score, gameOver, lastFoundWord,
  onResetGame, onShowWords, usedWordsCount, mode,
}: GameInfoProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {/* Mode badge */}
      {mode === 'surge' && (
        <div className="flex items-center justify-center gap-2 rounded-lg py-1 px-3 self-center" style={{ background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.3)' }}>
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">Word Surge</span>
        </div>
      )}

      {/* Score & Moves - horizontal on mobile */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl p-3 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">Poäng</div>
          <div className="text-2xl md:text-3xl font-bold text-white">{score}</div>
        </div>
        <div className="flex-1 rounded-xl p-3 md:p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-white">Drag kvar</div>
          <div className={`text-2xl md:text-3xl font-bold ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
            {movesLeft}
          </div>
        </div>
      </div>

      {lastFoundWord && (
        <div className="rounded-xl p-2 md:p-3 text-center animate-pulse" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}>
          <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 text-green-300 mb-1">Ord hittat!</div>
          <div className="text-xl md:text-2xl font-bold tracking-widest text-green-300">{lastFoundWord}</div>
        </div>
      )}

      {gameOver && (
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.3)' }}>
          <div className="text-xl font-bold text-white mb-2">Game Over!</div>
          <div className="text-white/70 mb-3">Slutpoäng: {score}</div>
          <Button onClick={onResetGame} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Nytt spel
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onShowWords}
          variant="outline"
          className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
        >
          <List className="w-4 h-4" /> Ord ({usedWordsCount})
        </Button>
        <Button
          onClick={onResetGame}
          variant="outline"
          className="gap-2 border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
