import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bomb, Calendar, Coins, Hash, Menu, Music, Star, Target, VolumeX, Volume2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { useCoins } from '@/hooks/useCoins';
import { useSfx } from '@/hooks/useSfx';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { GameBoard, type GameBoardHandle } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { WordHistory } from '@/components/game/WordHistory';
import { InGameMenu } from '@/components/game/InGameMenu';
import { LightningOverlay } from '@/components/game/LightningOverlay';
import { useGameEffects } from '@/hooks/useGameEffects';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { computeStars, STAR_REWARDS } from '@/data/dailyChallenges';

const MODE_BADGE: Record<string, { icon: React.ReactNode; color: string; border: string }> = {
  classic: { icon: null, color: 'rgba(148,163,184,0.2)', border: 'rgba(148,163,184,0.5)' },
  surge: { icon: <Zap className="w-4 h-4 text-yellow-400" />, color: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.5)' },
  fiveplus: { icon: <Hash className="w-4 h-4 text-cyan-400" />, color: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.5)' },
  bomb: { icon: <Bomb className="w-4 h-4 text-red-400" />, color: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)' },
  oneword: { icon: <Target className="w-4 h-4 text-emerald-400" />, color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.5)' },
};

const DailyChallengePage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const bg = useGameBackground();
  const sv = settings.language === 'sv';
  const { challenge, isCompleted: alreadyDoneToday, stars: prevStars, markCompleted } = useDailyChallenge();

  const { isValidWord, loading } = useDictionary(settings.language);
  const game = useGameState(isValidWord, challenge.mode, settings.language);
  const { addCoins } = useCoins();
  const { playSwap, playWordFound, playGameOver } = useSfx();
  const [showWords, setShowWords] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const boardRef = useRef<GameBoardHandle | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);
  const getCellRect = useCallback((row: number, col: number) => boardRef.current?.getCellRect(row, col) ?? null, []);
  const { lightning } = useGameEffects({
    lastWordEvent: game.lastWordEvent,
    movesUsed: game.movesUsed,
    getCellRect,
    containerEl: boardWrapperRef.current,
  });

  // Detect "survive" win (bomb mode reaching the target moves before exploding).
  const surviveTarget = challenge.surviveMoves;
  const survived = !!surviveTarget && game.movesUsed >= surviveTarget && !game.gameOver;
  const isOver = game.gameOver || survived;

  useBackgroundMusic(!isOver && !showMenu);

  // Reset on mount.
  useEffect(() => {
    if (loading) return;
    game.resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, challenge.id, settings.language]);

  const metricValue = useMemo(() => {
    if (challenge.metric === 'words') return game.usedWords.length;
    if (challenge.metric === 'bestWord') return game.bestWordScore;
    return game.score;
  }, [challenge.metric, game.score, game.usedWords.length, game.bestWordScore]);

  const earnedStars = useMemo(() => {
    if (!isOver) return 0;
    return computeStars(challenge, metricValue, !!surviveTarget ? survived : true);
  }, [isOver, challenge, metricValue, survived, surviveTarget]);

  const [resultSaved, setResultSaved] = useState(false);
  useEffect(() => {
    if (!isOver || resultSaved) return;
    setResultSaved(true);
    if (game.gameOver && challenge.mode === 'bomb') playGameOver();
    if (earnedStars > 0) {
      const delta = Math.max(0, STAR_REWARDS[earnedStars] - STAR_REWARDS[Math.min(prevStars, earnedStars - 1) as 0 | 1 | 2]);
      if (delta > 0) addCoins(delta);
      markCompleted(earnedStars as 1 | 2 | 3);
    }
  }, [isOver, resultSaved, earnedStars, prevStars, game.gameOver, challenge.mode, playGameOver, addCoins, markCompleted]);

  useEffect(() => { if (game.lastFoundWord) playWordFound(); }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    if (isOver) return;
    const hadSelection = game.selectedBubble !== null;
    game.handleBubbleClick(row, col);
    if (hadSelection) playSwap();
  }, [game, playSwap, isOver]);

  const handleSwipe = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    if (isOver) return;
    game.handleSwipe(from, to);
  }, [game, isOver]);

  const handleRetry = useCallback(() => {
    setResultSaved(false);
    game.resetGame();
  }, [game]);

  const badge = MODE_BADGE[challenge.mode];

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white/70">{sv ? 'Laddar...' : 'Loading...'}</div>
      </div>
    );
  }

  // Already completed for today — block play, show summary instead.
  if (alreadyDoneToday && !resultSaved) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${bg.className}`} style={bg.style}>
        <div className="max-w-xs w-full rounded-3xl p-6 text-center" style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Calendar className="w-10 h-10 text-amber-300 mx-auto mb-2" />
          <h1 className="text-white text-xl font-bold mb-1">{sv ? challenge.titleSv : challenge.titleEn}</h1>
          <div className="flex justify-center gap-1 my-3">
            {[1, 2, 3].map(n => (
              <Star key={n} className={`w-7 h-7 ${n <= prevStars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
            ))}
          </div>
          <p className="text-white/70 text-sm mb-4">
            {sv ? 'Du har klarat dagens utmaning. Kom tillbaka imorgon för en ny!' : "You've completed today's challenge. Come back tomorrow for a new one!"}
          </p>
          <Button onClick={() => navigate('/')} className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" /> {sv ? 'Huvudmeny' : 'Main menu'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] flex flex-col items-center ${bg.className}`} style={bg.style}>
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-3 pt-2 pb-0 max-w-4xl shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })} className="p-2 rounded-lg hover:bg-white/10">
            {settings.musicEnabled ? <Music className="w-5 h-5 text-white/70" /> : <VolumeX className="w-5 h-5 text-white/40" />}
          </button>
          <button onClick={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })} className="p-2 rounded-lg hover:bg-white/10">
            {settings.sfxEnabled ? <Volume2 className="w-5 h-5 text-white/70" /> : <VolumeX className="w-5 h-5 text-white/40" />}
          </button>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-2 rounded-lg hover:bg-white/10">
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex flex-col flex-1 w-full items-center min-h-0 px-1 max-w-md">
        {/* Title + daily badge */}
        <div className="w-full flex flex-col items-center pt-1 pb-2">
          <div className="flex items-center gap-1.5 rounded-full px-3 py-0.5 mb-1" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.45)' }}>
            <Calendar className="w-3 h-3 text-amber-300" />
            <span className="text-[10px] uppercase tracking-wider text-amber-200 font-semibold">{sv ? 'Daglig utmaning' : 'Daily Challenge'}</span>
          </div>
          <h1 className="text-2xl text-white font-bold" style={{ fontFamily: '"Fredoka One", cursive' }}>
            {sv ? challenge.titleSv : challenge.titleEn}
          </h1>
          {badge.icon && (
            <div className="flex items-center gap-1.5 rounded-lg py-0.5 px-2.5 mt-1" style={{ background: badge.color, border: `1px solid ${badge.border}` }}>
              {badge.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                {challenge.mode === 'bomb' ? 'Bomb' : challenge.mode === 'surge' ? 'Surge' : challenge.mode === 'oneword' ? 'One Word' : challenge.mode === 'fiveplus' ? '5+' : 'Classic'}
              </span>
            </div>
          )}
        </div>

        {/* Survive countdown bar (bomb-survive challenges) */}
        {surviveTarget && (
          <div className="w-full px-3 mb-2">
            <div className="flex items-center justify-between text-[11px] text-white/70 mb-1">
              <span>{sv ? 'Drag kvar att överleva' : 'Moves left to survive'}</span>
              <span className="font-bold text-amber-300">{Math.max(0, surviveTarget - game.movesUsed)} / {surviveTarget}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, (game.movesUsed / surviveTarget) * 100)}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #ec4899)',
                }}
              />
            </div>
          </div>
        )}

        {/* Board */}
        <div ref={boardWrapperRef} className="relative flex items-start justify-center w-full">
          <GameBoard
            ref={boardRef}
            grid={game.grid}
            selectedBubble={game.selectedBubble}
            poppingCells={game.poppingCells}
            onBubbleClick={handleBubbleClick}
            onSwipe={handleSwipe}
            bonusPopups={game.bonusPopups}
            onBonusPopupDone={game.removeBonusPopup}
          />
          <LightningOverlay event={lightning} getCellRect={getCellRect} containerEl={boardWrapperRef.current} />
        </div>

        {/* Info panel */}
        <div className="w-full pt-1.5 pb-4">
          <GameInfo
            movesLeft={game.movesLeft}
            score={game.score}
            lastFoundWord={game.lastFoundWord}
            onResetGame={handleRetry}
            onShowWords={() => setShowWords(true)}
            usedWordsCount={game.usedWords.length}
            mode={challenge.mode}
            bestWordScore={game.bestWordScore}
            bestWord={game.bestWord}
            freeMovesRemaining={game.freeMovesRemaining}
            hideBadge
          />
        </div>
      </div>

      <WordHistory open={showWords} onOpenChange={setShowWords} words={game.usedWords} />
      <InGameMenu open={showMenu} onClose={() => setShowMenu(false)} />

      {/* Custom result overlay */}
      {isOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-xs w-full rounded-3xl p-6 text-center" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="text-3xl mb-1">{earnedStars > 0 ? '🏆' : '💥'}</div>
            <h2 className="text-white text-xl font-bold mb-1">
              {earnedStars > 0 ? (sv ? 'Bra jobbat!' : 'Well done!') : (sv ? 'Försök igen' : 'Try again')}
            </h2>
            <p className="text-white/60 text-sm mb-3">{sv ? challenge.titleSv : challenge.titleEn}</p>
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3].map(n => (
                <Star key={n} className={`w-9 h-9 ${n <= earnedStars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
              ))}
            </div>
            <div className="flex justify-around text-sm text-white/80 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-70">{sv ? 'Poäng' : 'Score'}</div>
                <div className="font-bold text-white">{challenge.metric === 'bestWord' ? game.bestWordScore : challenge.metric === 'words' ? `${game.usedWords.length} ${sv ? 'ord' : 'words'}` : game.score}</div>
              </div>
              {earnedStars > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">{sv ? 'Belöning' : 'Reward'}</div>
                  <div className="font-bold text-yellow-300 flex items-center gap-1 justify-center">
                    <Coins className="w-3.5 h-3.5" /> {STAR_REWARDS[earnedStars]}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {earnedStars === 0 && (
                <Button onClick={handleRetry} className="w-full" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(236,72,153,0.9))' }}>
                  {sv ? 'Försök igen' : 'Try again'}
                </Button>
              )}
              <Button onClick={() => navigate('/')} variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-1" /> {sv ? 'Huvudmeny' : 'Main menu'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyChallengePage;
