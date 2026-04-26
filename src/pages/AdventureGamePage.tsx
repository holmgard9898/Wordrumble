import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { useCoins } from '@/hooks/useCoins';
import { useUnlocks } from '@/hooks/useUnlocks';
import { useSfx } from '@/hooks/useSfx';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { GameBoard, type GameBoardHandle } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { InGameMenu } from '@/components/game/InGameMenu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Menu, Trophy, Map as MapIcon, RotateCcw, Play, Video, Home } from 'lucide-react';
import { getLevelById, adventureLevels } from '@/data/adventureLevels';
import { useAdventureProgress } from '@/hooks/useAdventureProgress';
import { useAds } from '@/hooks/useAds';
import { useSavedGame } from '@/hooks/useSavedGame';

const AdventureGamePage = () => {
  const { levelId = '' } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const level = getLevelById(levelId);
  const nextLevel = useMemo(() => {
    if (!level) return null;
    const nextId = level.connectsTo[0];
    return nextId ? adventureLevels.find(l => l.id === nextId) ?? null : null;
  }, [level]);
  const bg = useGameBackground(level?.background);
  const { isValidWord, loading } = useDictionary(settings.language);
  const adventureSeed = useMemo(() => {
    if (!level) return undefined;
    if (level.goal.type === 'find-words') {
      return { targetWords: level.goal.words[settings.language], maxMoves: level.maxMoves };
    }
    return level.maxMoves ? { targetWords: [] as string[], maxMoves: level.maxMoves } : undefined;
  }, [level, settings.language]);
  const game = useGameState(isValidWord, 'classic', settings.language, adventureSeed);
  const { addCoins } = useCoins();
  const { unlock } = useUnlocks();
  const { markCompleted } = useAdventureProgress();
  const { playWordFound } = useSfx();
  const { showRewardedAd } = useAds();
  const [showIntro, setShowIntro] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [ready, setReady] = useState(false);
  const boardRef = useRef<GameBoardHandle | null>(null);

  useBackgroundMusic(!showSuccess && !showMenu && !showIntro);

  // Reset game when level/language changes; mark ready on next tick so the
  // success-detection effect doesn't fire against stale state from the prior level.
  useEffect(() => {
    if (loading) return;
    setReady(false);
    setShowSuccess(false);
    game.resetGame();
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [loading, levelId, settings.language]);

  // Per-level target words (lowercase)
  const targetWords = useMemo<string[]>(() => {
    if (!level || level.goal.type !== 'find-words') return [];
    return level.goal.words[settings.language].map(w => w.toLowerCase());
  }, [level, settings.language]);

  const foundTargets = useMemo(() => {
    const set = new Set(game.usedWords.map(w => w.word.toLowerCase()));
    return targetWords.filter(w => set.has(w));
  }, [game.usedWords, targetWords]);

  // Goal completion
  useEffect(() => {
    if (!level || showSuccess || !ready) return;
    let done = false;
    if (level.goal.type === 'find-words') done = foundTargets.length >= targetWords.length && targetWords.length > 0;
    else if (level.goal.type === 'reach-score') done = game.score >= level.goal.target;
    else if (level.goal.type === 'find-long-word') {
      const minLen = level.goal.minLength;
      done = game.usedWords.some(w => w.word.length >= minLen);
    }
    if (done) {
      setShowSuccess(true);
      addCoins(20);
      markCompleted(level.id);
      if (level.unlocksShopItem) unlock(level.unlocksShopItem);
    }
  }, [game.score, game.usedWords, foundTargets, targetWords, level, showSuccess, ready, addCoins, markCompleted, unlock]);

  useEffect(() => { if (game.lastFoundWord) playWordFound(); }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => game.handleBubbleClick(row, col), [game]);

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <Button onClick={() => navigate('/adventure')}>Back</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg.className}`} style={bg.style}>
        <div className="text-white">{t.loadingDict ?? 'Loading...'}</div>
      </div>
    );
  }

  const goalText = (() => {
    if (level.goal.type === 'reach-score') return `${t.goalReachScore} ${level.goal.target}`;
    if (level.goal.type === 'find-long-word') return `${t.goalLongWord} ${level.goal.minLength} ${t.letters}`;
    return t.goalFindWords;
  })();

  return (
    <div className={`h-[100dvh] flex flex-col items-center ${bg.className}`} style={bg.style}>
      <div className="w-full flex items-center justify-between px-3 pt-2 pb-1 max-w-4xl shrink-0">
        <button onClick={() => navigate('/adventure')} className="p-2 rounded-lg hover:bg-white/10">
          <MapIcon className="w-5 h-5 text-white" />
        </button>
        <div className="text-white font-bold text-lg flex items-center gap-2">
          <span>{level.icon}</span>
          <span>{level.name[settings.language]}</span>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-2 rounded-lg hover:bg-white/10">
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Goal banner */}
      <div className="w-full max-w-md px-3 pb-2">
        <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="text-white/70 text-xs uppercase tracking-wider">{t.adventureGoal}</div>
          <div className="text-white text-sm font-medium">{goalText}</div>
          {level.goal.type === 'find-words' && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-1.5">
              {targetWords.map(w => {
                const found = foundTargets.includes(w);
                return (
                  <span key={w} className={`px-2 py-0.5 rounded text-xs font-bold ${found ? 'line-through text-emerald-300' : 'text-white'}`} style={{ background: found ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)' }}>
                    {w.toUpperCase()}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center w-full">
        <GameBoard
          ref={boardRef}
          grid={game.grid}
          selectedBubble={game.selectedBubble}
          poppingCells={game.poppingCells}
          onBubbleClick={handleBubbleClick}
          onSwipe={game.handleSwipe}
          bonusPopups={game.bonusPopups}
          onBonusPopupDone={game.removeBonusPopup}
        />
      </div>

      <div className="w-full pt-1.5 pb-4">
        <GameInfo
          movesLeft={game.movesLeft}
          score={game.score}
          lastFoundWord={game.lastFoundWord}
          onResetGame={() => game.resetGame()}
          onShowWords={() => {}}
          usedWordsCount={game.usedWords.length}
          mode={'classic'}
          bestWordScore={game.bestWordScore}
          bestWord={game.bestWord}
          freeMovesRemaining={game.freeMovesRemaining}
          hideBadge
        />
      </div>

      <InGameMenu open={showMenu} onClose={() => setShowMenu(false)} />

      {/* Intro modal */}
      <Dialog open={showIntro} onOpenChange={setShowIntro}>
        <DialogContent className="max-w-xs rounded-2xl border-white/10" style={{ background: 'rgba(15,23,42,0.95)' }}>
          <DialogHeader>
            <DialogTitle className="text-white text-center text-2xl">{level.icon} {level.name[settings.language]}</DialogTitle>
            <DialogDescription className="text-white/80 text-center pt-2">{level.intro[settings.language]}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowIntro(false)} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white">{t.adventureStart}</Button>
        </DialogContent>
      </Dialog>

      {/* Success modal */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="max-w-xs rounded-2xl border-emerald-500/30" style={{ background: 'linear-gradient(135deg, rgba(20,80,40,0.95), rgba(10,40,20,0.95))' }}>
          <DialogHeader>
            <DialogTitle className="text-white text-center text-2xl flex items-center justify-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-400" /> {t.adventureCongrats}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-center pt-2">{t.adventureLevelComplete} +20 coins</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {nextLevel && (
              <Button onClick={() => { setShowSuccess(false); navigate(`/adventure/${nextLevel.id}`); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                <Play className="w-4 h-4" /> {t.adventureNextLevel}
              </Button>
            )}
            <Button onClick={() => navigate('/adventure')} variant="outline" className="w-full gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <MapIcon className="w-4 h-4" /> {t.adventureBackToMap}
            </Button>
            <Button onClick={() => { setShowSuccess(false); game.resetGame(); }} variant="ghost" className="w-full gap-2 text-white/80 hover:text-white hover:bg-white/10">
              <RotateCcw className="w-4 h-4" /> {t.adventurePlayAgain}
            </Button>
            <Button onClick={() => navigate('/')} variant="ghost" className="w-full gap-2 text-white/60 hover:text-white hover:bg-white/10">
              <Home className="w-4 h-4" /> {t.mainMenu}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game over modal */}
      <Dialog open={game.gameOver && !showSuccess && !watchingAd} onOpenChange={() => {}}>
        <DialogContent className="max-w-xs rounded-2xl border-red-500/30" style={{ background: 'linear-gradient(135deg, rgba(80,20,20,0.95), rgba(40,10,10,0.95))' }}>
          <DialogHeader>
            <DialogTitle className="text-white text-center text-2xl">💥 {t.adventureGameOver}</DialogTitle>
            <DialogDescription className="text-white/80 text-center pt-2">{t.score}: {game.score}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              onClick={async () => {
                setWatchingAd(true);
                const res = await showRewardedAd();
                setWatchingAd(false);
                if (res.success) game.addMoves(5);
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black gap-2"
            >
              <Video className="w-4 h-4" /> {t.adventureWatchAd}
            </Button>
            <Button onClick={() => game.resetGame()} variant="outline" className="w-full gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <RotateCcw className="w-4 h-4" /> {t.adventureTryAgain}
            </Button>
            <Button onClick={() => navigate('/adventure')} variant="ghost" className="w-full gap-2 text-white/80 hover:text-white hover:bg-white/10">
              <MapIcon className="w-4 h-4" /> {t.adventureBackToMap}
            </Button>
            <Button onClick={() => navigate('/')} variant="ghost" className="w-full gap-2 text-white/60 hover:text-white hover:bg-white/10">
              <Home className="w-4 h-4" /> {t.mainMenu}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdventureGamePage;
