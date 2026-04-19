import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { useHighScores } from '@/hooks/useHighScores';
import { useCoins } from '@/hooks/useCoins';
import { useUnlocks } from '@/hooks/useUnlocks';
import { useSfx } from '@/hooks/useSfx';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { GameBoard } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { WordHistory } from '@/components/game/WordHistory';
import { InGameMenu } from '@/components/game/InGameMenu';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { calculateCoinReward } from '@/utils/coinRewards';
import { Menu, Volume2, VolumeX, Music, Zap, Bomb, Hash, Target } from 'lucide-react';

export type GameMode = 'classic' | 'surge' | 'fiveplus' | 'bomb' | 'oneword';

const MODE_BADGE_CONFIG: Record<GameMode, { icon: string; color: string; border: string } | null> = {
  classic: null,
  surge: { icon: 'zap', color: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.3)' },
  fiveplus: { icon: 'hash', color: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.3)' },
  bomb: { icon: 'bomb', color: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.3)' },
  oneword: { icon: 'target', color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)' },
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  zap: <Zap className="w-4 h-4 text-yellow-400" />,
  hash: <Hash className="w-4 h-4 text-cyan-400" />,
  bomb: <Bomb className="w-4 h-4 text-red-400" />,
  target: <Target className="w-4 h-4 text-emerald-400" />,
};

const GamePage = () => {
  const { mode = 'classic' } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const bg = useGameBackground();
  const { t } = useTranslation();
  const gameMode = (['classic', 'surge', 'fiveplus', 'bomb', 'oneword'].includes(mode) ? mode : 'classic') as GameMode;

  const MODE_LABELS: Record<GameMode, string> = {
    classic: t.modeClassic, surge: t.modeSurge, fiveplus: t.modeFiveplus, bomb: t.modeBomb, oneword: t.modeOneword,
  };

  const { isValidWord, loading } = useDictionary(settings.language);
  const game = useGameState(isValidWord, gameMode, settings.language);
  const { addScore } = useHighScores();
  const { addCoins } = useCoins();
  const { unlock } = useUnlocks();
  const { recordClassicPlayed, recordSurgeMoves, recordBestSingleWord, recordBombScore } = useGameProgress();
  const { playSwap, playWordFound, playGameOver } = useSfx();
  const [showWords, setShowWords] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  useBackgroundMusic(!game.gameOver && !showMenu);

  useEffect(() => {
    if (!loading) {
      setScoreSaved(false);
      game.resetGame();
    }
  }, [loading, gameMode, settings.language]);

  const finalScore = gameMode === 'oneword' ? game.bestWordScore : game.score;

  const coinReward = useMemo(() => {
    if (!game.gameOver) return null;
    return calculateCoinReward(gameMode, game.score, game.usedWords, game.movesUsed, game.bestWordScore);
  }, [game.gameOver, gameMode, game.score, game.usedWords, game.movesUsed, game.bestWordScore]);

  useEffect(() => {
    if (game.gameOver && !scoreSaved) {
      addScore({ score: finalScore, wordsFound: game.usedWords.length, mode: gameMode, date: new Date().toISOString() });
      if (coinReward && coinReward.total > 0) addCoins(coinReward.total);
      setScoreSaved(true);
      if (gameMode === 'classic') recordClassicPlayed();
      if (gameMode === 'surge') recordSurgeMoves(game.movesUsed);
      if (gameMode === 'bomb') {
        recordBombScore(game.score);
        playGameOver();
        // Achievement: unlock Volcano background at 200+ points in Bomb Mode
        if (game.score >= 200) unlock('bg-volcano');
      }
      if (game.bestWordScore > 0) recordBestSingleWord(game.bestWordScore);
    }
  }, [game.gameOver, scoreSaved, finalScore, game.usedWords.length, gameMode, addScore, playGameOver, game.movesUsed, game.score, game.bestWordScore, recordClassicPlayed, recordSurgeMoves, recordBestSingleWord, recordBombScore, coinReward, addCoins]);

  useEffect(() => { if (game.lastFoundWord) playWordFound(); }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    const hadSelection = game.selectedBubble !== null;
    game.handleBubbleClick(row, col);
    if (hadSelection) playSwap();
  }, [game, playSwap]);

  const handleReset = useCallback(() => { setScoreSaved(false); game.resetGame(); }, [game]);

  const badgeConfig = MODE_BADGE_CONFIG[gameMode];

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Word Rumble</div>
        <div className="text-white/60">{t.loadingDict}</div>
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] flex flex-col items-center ${bg.className}`} style={bg.style}>
      {/* ── Top bar: quick toggles left, menu right ── */}
      <div className="w-full flex items-center justify-between px-3 pt-2 pb-0 md:py-3 md:px-4 max-w-4xl shrink-0 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {settings.musicEnabled
              ? <Music className="w-5 h-5 text-white/70" />
              : <VolumeX className="w-5 h-5 text-white/40" />}
          </button>
          <button
            onClick={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {settings.sfxEnabled
              ? <Volume2 className="w-5 h-5 text-white/70" />
              : <VolumeX className="w-5 h-5 text-white/40" />}
          </button>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex w-full items-center justify-between px-4 py-3 max-w-4xl shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight opacity-80">Word Rumble</h1>
        <button onClick={() => setShowMenu(true)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex gap-6 items-start w-full max-w-4xl flex-1 px-4">
        <div className="w-[450px] shrink-0">
          <GameBoard
            grid={game.grid}
            selectedBubble={game.selectedBubble}
            poppingCells={game.poppingCells}
            onBubbleClick={handleBubbleClick}
            onSwipe={game.handleSwipe}
            bonusPopups={game.bonusPopups}
            onBonusPopupDone={game.removeBonusPopup}
          />
        </div>
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
          freeMovesRemaining={game.freeMovesRemaining}
        />
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex lg:hidden flex-col flex-1 w-full items-center min-h-0 px-1">
        {/* Title + mode badge */}
        <div className="w-full flex flex-col items-center pt-1 pb-2">
          <h1 className="text-3xl tracking-wide" style={{ fontFamily: '"Fredoka One", cursive' }}>
            <span className="text-yellow-400">Word</span>
            <span className="text-white/90"> </span>
            <span className="text-pink-400">Rumble</span>
          </h1>
          {badgeConfig && (
            <div className="flex items-center justify-center gap-1.5 rounded-lg py-0.5 px-3 mt-1" style={{ background: badgeConfig.color, border: `1px solid ${badgeConfig.border}` }}>
              {BADGE_ICONS[badgeConfig.icon]}
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: badgeConfig.border.replace('0.3', '1') }}>{MODE_LABELS[gameMode]}</span>
            </div>
          )}
        </div>

        {/* Game board */}
        <div className="flex items-center justify-center w-full">
          <GameBoard
            grid={game.grid}
            selectedBubble={game.selectedBubble}
            poppingCells={game.poppingCells}
            onBubbleClick={handleBubbleClick}
            onSwipe={game.handleSwipe}
            bonusPopups={game.bonusPopups}
            onBonusPopupDone={game.removeBonusPopup}
          />
        </div>

        {/* Info panel */}
        <div className="w-full pt-1.5 pb-4">
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
            freeMovesRemaining={game.freeMovesRemaining}
            hideBadge
          />
        </div>
      </div>

      <WordHistory open={showWords} onOpenChange={setShowWords} words={game.usedWords} />
      <InGameMenu open={showMenu} onClose={() => setShowMenu(false)} />
      {game.gameOver && (
        <GameOverOverlay score={finalScore} wordsFound={game.usedWords.length} mode={gameMode} onRestart={handleReset} bestWord={game.bestWord} bestWordScore={game.bestWordScore} coinReward={coinReward} />
      )}
    </div>
  );
};

export default GamePage;
