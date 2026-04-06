import { useState } from 'react';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { GameBoard } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { WordHistory } from '@/components/game/WordHistory';

const Index = () => {
  const { isValidWord, loading } = useDictionary();
  const game = useGameState(isValidWord);
  const [showWords, setShowWords] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 game-bg">
        <div className="text-white text-2xl font-bold">🫧 Bubble Words</div>
        <div className="text-white/60">Laddar ordlista...</div>
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 game-bg">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
        🫧 Bubble Words
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
        <GameBoard
          grid={game.grid}
          selectedBubble={game.selectedBubble}
          poppingCells={game.poppingCells}
          onBubbleClick={game.handleBubbleClick}
        />

        <GameInfo
          movesLeft={game.movesLeft}
          score={game.score}
          gameOver={game.gameOver}
          lastFoundWord={game.lastFoundWord}
          onResetGame={game.resetGame}
          onShowWords={() => setShowWords(true)}
          usedWordsCount={game.usedWords.length}
        />
      </div>

      <WordHistory
        open={showWords}
        onOpenChange={setShowWords}
        words={game.usedWords}
      />
    </div>
  );
};

export default Index;
