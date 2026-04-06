import { Button } from '@/components/ui/button';
import { RotateCcw, List } from 'lucide-react';

interface GameInfoProps {
  movesLeft: number;
  score: number;
  gameOver: boolean;
  lastFoundWord: string | null;
  onResetGame: () => void;
  onShowWords: () => void;
  usedWordsCount: number;
}

export function GameInfo({
  movesLeft, score, gameOver, lastFoundWord,
  onResetGame, onShowWords, usedWordsCount,
}: GameInfoProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      {/* Score & Moves */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="text-xs uppercase tracking-wider opacity-70 text-white">Poäng</div>
          <div className="text-3xl font-bold text-white">{score}</div>
        </div>
        <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="text-xs uppercase tracking-wider opacity-70 text-white">Drag kvar</div>
          <div className={`text-3xl font-bold ${movesLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
            {movesLeft}
          </div>
        </div>
      </div>

      {/* Last found word */}
      {lastFoundWord && (
        <div className="rounded-xl p-3 text-center animate-pulse" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}>
          <div className="text-xs uppercase tracking-wider opacity-70 text-green-300 mb-1">Ord hittat!</div>
          <div className="text-2xl font-bold tracking-widest text-green-300">{lastFoundWord}</div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.3)' }}>
          <div className="text-xl font-bold text-white mb-2">Game Over!</div>
          <div className="text-white/70 mb-3">Slutpoäng: {score}</div>
          <Button onClick={onResetGame} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Nytt spel
          </Button>
        </div>
      )}

      {/* Actions */}
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

      {/* Instructions */}
      <div className="rounded-xl p-3 text-xs text-white/60 space-y-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <p><strong className="text-white/80">Så spelar du:</strong> Klicka på en bubbla, sedan en intilliggande bubbla för att byta plats (1 drag).</p>
        <p><strong className="text-white/80">Ord:</strong> Bildas automatiskt av samma-färg bubblor i rad (→) eller kolumn (↓). Minst 3 bokstäver.</p>
        <p><strong className="text-white/80">Mål:</strong> Få så många poäng som möjligt på 50 drag!</p>
      </div>
    </div>
  );
}
