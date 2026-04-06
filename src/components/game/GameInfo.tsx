import { Button } from '@/components/ui/button';
import { ArrowLeftRight, MousePointerClick, RotateCcw, List, Send, X } from 'lucide-react';

interface GameInfoProps {
  movesLeft: number;
  score: number;
  mode: 'swap' | 'select';
  gameOver: boolean;
  currentWord: string;
  selectedWordLength: number;
  onToggleMode: () => void;
  onSubmitWord: () => void;
  onClearSelection: () => void;
  onResetGame: () => void;
  onShowWords: () => void;
  usedWordsCount: number;
}

export function GameInfo({
  movesLeft, score, mode, gameOver, currentWord, selectedWordLength,
  onToggleMode, onSubmitWord, onClearSelection, onResetGame, onShowWords, usedWordsCount,
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

      {/* Mode Toggle */}
      <Button
        onClick={onToggleMode}
        variant="outline"
        className="w-full gap-2 border-white/20 text-white hover:bg-white/10"
        disabled={gameOver}
      >
        {mode === 'swap' ? (
          <><ArrowLeftRight className="w-4 h-4" /> Byt-läge (Swap)</>
        ) : (
          <><MousePointerClick className="w-4 h-4" /> Välj ord-läge (Select)</>
        )}
      </Button>

      {/* Current word preview */}
      {mode === 'select' && selectedWordLength > 0 && (
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="text-xs uppercase tracking-wider opacity-70 text-white mb-1">Valt ord</div>
          <div className="text-2xl font-bold tracking-widest text-yellow-300">{currentWord}</div>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={onSubmitWord}
              size="sm"
              className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={selectedWordLength < 3}
            >
              <Send className="w-3 h-3" /> Skicka
            </Button>
            <Button
              onClick={onClearSelection}
              size="sm"
              variant="outline"
              className="gap-1 border-white/20 text-white hover:bg-white/10"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="rounded-xl p-4 text-center bg-red-900/50 border border-red-500/30">
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
        <p><strong className="text-white/80">Swap-läge:</strong> Klicka två intilliggande bubblor för att byta plats (1 drag).</p>
        <p><strong className="text-white/80">Välj ord-läge:</strong> Klicka samma-färg bubblor i rad/kolumn för att bilda ord. Tryck Skicka.</p>
        <p><strong className="text-white/80">Regler:</strong> Minst 3 bokstäver. Bara samma färg. Ej diagonalt.</p>
      </div>
    </div>
  );
}
