import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { useHighScores } from '@/hooks/useHighScores';
import { useSfx } from '@/hooks/useSfx';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { GameBoard } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { WordHistory } from '@/components/game/WordHistory';
import { InGameMenu } from '@/components/game/InGameMenu';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { Menu } from 'lucide-react';

export type GameMode = 'classic' | 'surge' | 'fiveplus' | 'bomb' | 'oneword';

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'Classic',
  surge: 'Word Surge',
  fiveplus: '5+ Bokstäver',
  bomb: 'Bomb Mode',
  oneword: 'Ett Ord',
};

const GamePage = () => {
  const { mode = 'classic' } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const bg = useGameBackground();
  const gameMode = (['classic', 'surge', 'fiveplus', 'bomb', 'oneword'].includes(mode) ? mode : 'classic') as GameMode;

  const { isValidWord, loading } = useDictionary(settings.language);
  const game = useGameState(isValidWord, gameMode, settings.language);
  const { addScore } = useHighScores();
  const { recordClassicPlayed, recordSurgeMoves, recordBestSingleWord, recordBombScore } = useGameProgress();
  const { playSwap, playWordFound, playGameOver } = useSfx();
  const [showWords, setShowWords] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  useBackgroundMusic(!game.gameOver && !showMenu);

  const finalScore = gameMode === 'oneword' ? game.bestWordScore : game.score;

  useEffect(() => {
    if (game.gameOver && !scoreSaved) {
      addScore({
        score: finalScore,
        wordsFound: game.usedWords.length,
        mode: MODE_LABELS[gameMode],
        date: new Date().toISOString(),
      });
      setScoreSaved(true);
      if (gameMode === 'bomb') playGameOver();
    }
  }, [game.gameOver, scoreSaved, finalScore, game.usedWords.length, gameMode, addScore, playGameOver]);

  useEffect(() => {
    if (game.lastFoundWord) {
      playWordFound();
    }
  }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    const hadSelection = game.selectedBubble !== null;
    game.handleBubbleClick(row, col);
    if (hadSelection) playSwap();
  }, [game, playSwap]);

  const handleReset = useCallback(() => {
    setScoreSaved(false);
    game.resetGame();
  }, [game]);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Word Rumble</div>
        <div className="text-white/60">Laddar ordlista...</div>
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center p-2 md:p-4 ${bg.className}`} style={bg.style}>
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 md:mb-4 px-1">
        <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
          Word Rumble
        </h1>
        <button
          onClick={() => setShowMenu(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 md:gap-6 items-center lg:items-start w-full max-w-4xl justify-center">
        <GameBoard
          grid={game.grid}
          selectedBubble={game.selectedBubble}
          poppingCells={game.poppingCells}
          onBubbleClick={handleBubbleClick}
          onSwipe={game.handleSwipe}
        />

        <GameInfo
          movesLeft={game.movesLeft}
          score={game.score}
          lastFoundWord={game.lastFoundWord}
          onResetGame={handleReset}
          onShowWords={() => setShowWords(true)}
          usedWordsCount={game.usedWords.length}
          mode={gameMode}
          bestWordScore={game.bestWordScore}
          bestWord={game.bestWord}
        />
      </div>

      <WordHistory
        open={showWords}
        onOpenChange={setShowWords}
        words={game.usedWords}
      />

      <InGameMenu open={showMenu} onClose={() => setShowMenu(false)} />

      {game.gameOver && (
        <GameOverOverlay
          score={finalScore}
          wordsFound={game.usedWords.length}
          mode={gameMode}
          onRestart={handleReset}
          bestWord={game.bestWord}
          bestWordScore={game.bestWordScore}
        />
      )}
    </div>
  );
};

export default GamePage;
