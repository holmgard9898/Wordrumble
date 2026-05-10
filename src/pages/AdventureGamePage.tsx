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
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Menu, Trophy, Map as MapIcon, RotateCcw, Play, Video, Home, Rocket, X } from 'lucide-react';
import { getLevelById, adventureLevels } from '@/data/adventureLevels';
import { useAdventureProgress } from '@/hooks/useAdventureProgress';
import { useAds } from '@/hooks/useAds';
import { useSavedGame } from '@/hooks/useSavedGame';
import { TutorialModal, type TutorialStep } from '@/components/TutorialModal';
import { getTutorialSteps } from '@/data/tutorials';

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
  const levelMode = level?.mode ?? 'classic';
  const adventureSeed = useMemo(() => {
    if (!level) return undefined;
    const antigravity = level.antigravity === true;
    const asteroids = level.asteroids === true;
    if (level.goal.type === 'find-words') {
      const words = level.goal.words[settings.language];
      return { targetWords: words, maxMoves: level.maxMoves, keepFormableWords: words, antigravity, asteroids };
    }
    if (level.goal.type === 'hidden-word') {
      const thematic = level.goal.thematicWords[settings.language];
      const hidden = level.goal.hiddenWord[settings.language];
      // Both the thematic words AND the hidden word must remain formable.
      return {
        targetWords: thematic,
        maxMoves: level.maxMoves,
        keepFormableWords: [hidden, ...thematic],
        antigravity,
        asteroids,
      };
    }
    if (level.maxMoves || antigravity || asteroids) {
      return { targetWords: [] as string[], maxMoves: level.maxMoves, antigravity, asteroids };
    }
    return undefined;
  }, [level, settings.language]);
  const game = useGameState(isValidWord, levelMode, settings.language, adventureSeed);
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
  const [rocketsLeft, setRocketsLeft] = useState(level?.freeRockets ?? 0);
  const [rocketArming, setRocketArming] = useState(false);

  useEffect(() => { setRocketsLeft(level?.freeRockets ?? 0); setRocketArming(false); }, [level?.id, level?.freeRockets]);

  useBackgroundMusic(!showSuccess && !showMenu && !showIntro);

  const savedGame = useSavedGame(`adv-${levelId}`);

  // Reset game when level/language changes; restore saved progress if any.
  // Tutorial/intro is always shown when entering a level (every time).
  useEffect(() => {
    if (loading) return;
    setReady(false);
    setShowSuccess(false);
    setShowIntro(true);
    const saved = savedGame.load();
    if (saved && saved.movesLeft > 0 && saved.usedWords) {
      game.restoreSavedGame({
        grid: saved.grid,
        movesLeft: saved.movesLeft,
        score: saved.score,
        usedWords: saved.usedWords,
        movesUsed: saved.movesUsed,
        freeMovesRemaining: saved.freeMovesRemaining,
      });
    } else {
      game.resetGame();
    }
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [loading, levelId, settings.language]);

  // Persist in-progress state
  useEffect(() => {
    if (loading || game.gameOver || showSuccess) return;
    if (game.movesUsed === 0 && game.usedWords.length === 0) return;
    savedGame.save({
      grid: game.grid,
      movesLeft: game.movesLeft,
      score: game.score,
      usedWords: game.usedWords,
      movesUsed: game.movesUsed,
      freeMovesRemaining: game.freeMovesRemaining,
    });
  }, [loading, game.gameOver, showSuccess, game.grid, game.movesLeft, game.score, game.usedWords, game.movesUsed, game.freeMovesRemaining, savedGame]);

  // Clear saved on success or game over
  useEffect(() => {
    if (showSuccess || game.gameOver) savedGame.clear();
  }, [showSuccess, game.gameOver, savedGame]);

  // Per-level target words (lowercase)
  const targetWords = useMemo<string[]>(() => {
    if (!level || level.goal.type !== 'find-words') return [];
    return level.goal.words[settings.language].map(w => w.toLowerCase());
  }, [level, settings.language]);

  const foundTargets = useMemo(() => {
    const set = new Set(game.usedWords.map(w => w.word.toLowerCase()));
    return targetWords.filter(w => set.has(w));
  }, [game.usedWords, targetWords]);

  // Hidden-word data
  const hiddenWord = useMemo<string>(() => {
    if (!level || level.goal.type !== 'hidden-word') return '';
    return level.goal.hiddenWord[settings.language].toUpperCase();
  }, [level, settings.language]);

  const hiddenThematic = useMemo<string[]>(() => {
    if (!level || level.goal.type !== 'hidden-word') return [];
    return level.goal.thematicWords[settings.language].map(w => w.toLowerCase());
  }, [level, settings.language]);

  // Keep useGameState's "must remain formable" list in sync with what the
  // player still needs to find. Words already used are dropped.
  useEffect(() => {
    if (!level) return;
    const used = new Set(game.usedWords.map(w => w.word.toLowerCase()));
    let remaining: string[] = [];
    if (level.goal.type === 'find-words') {
      remaining = level.goal.words[settings.language].filter(w => !used.has(w.toLowerCase()));
    } else if (level.goal.type === 'hidden-word') {
      const hidden = level.goal.hiddenWord[settings.language];
      const thematic = level.goal.thematicWords[settings.language].filter(w => !used.has(w.toLowerCase()));
      remaining = used.has(hidden.toLowerCase()) ? thematic : [hidden, ...thematic];
    }
    game.setKeepFormableWords(remaining);
  }, [level, settings.language, game.usedWords, game.setKeepFormableWords]);

  // Number of hidden-word letters revealed = number of distinct thematic words found (capped at hidden word length)
  const hiddenFoundCount = useMemo(() => {
    if (!hiddenWord) return 0;
    const found = new Set<string>();
    for (const w of game.usedWords) {
      const lw = w.word.toLowerCase();
      if (hiddenThematic.includes(lw)) found.add(lw);
    }
    return Math.min(found.size, hiddenWord.length);
  }, [game.usedWords, hiddenThematic, hiddenWord]);

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
    else if (level.goal.type === 'survive-moves') done = game.movesUsed >= level.goal.moves;
    else if (level.goal.type === 'hidden-word') {
      const formedHidden = game.usedWords.some(w => w.word.toLowerCase() === hiddenWord.toLowerCase());
      done = formedHidden;
    }
    else if (level.goal.type === 'best-word-score') {
      done = (game.bestWordScore ?? 0) >= level.goal.target;
    }
    else if (level.goal.type === 'destroy-asteroids') {
      done = (game.asteroidsDestroyed ?? 0) >= level.goal.count;
    }
    if (done) {
      setShowSuccess(true);
      addCoins(20);
      markCompleted(level.id);
      if (level.unlocksShopItem) unlock(level.unlocksShopItem);
    }
  }, [game.score, game.usedWords, game.movesUsed, foundTargets, targetWords, hiddenFoundCount, hiddenWord, level, showSuccess, ready, addCoins, markCompleted, unlock]);

  useEffect(() => { if (game.lastFoundWord) playWordFound(); }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    if (rocketArming) {
      // Fire rocket on this column
      if (rocketsLeft > 0 && game.fireRocket) {
        game.fireRocket(col);
        setRocketsLeft(n => n - 1);
      }
      setRocketArming(false);
      return;
    }
    game.handleBubbleClick(row, col);
  }, [game, rocketArming, rocketsLeft]);

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

  const hiddenLabels: Record<string, string> = {
    en: 'Reveal the hidden word:', sv: 'Avslöja det dolda ordet:', de: 'Enthülle das versteckte Wort:',
    es: 'Revela la palabra oculta:', fr: 'Révélez le mot caché :', it: 'Rivela la parola nascosta:',
    pt: 'Revele a palavra oculta:', nl: 'Onthul het verborgen woord:', no: 'Avslør det skjulte ordet:',
    da: 'Afslør det skjulte ord:', fi: 'Paljasta salainen sana:',
  };

  const goalText = (() => {
    if (level.goal.type === 'reach-score') return `${t.goalReachScore} ${level.goal.target}`;
    if (level.goal.type === 'find-long-word') return `${t.goalLongWord} ${level.goal.minLength} ${t.letters}`;
    if (level.goal.type === 'survive-moves') {
      const labels: Record<string, string> = { en: 'Survive moves:', sv: 'Överlev drag:', de: 'Überlebe Züge:', es: 'Sobrevive movimientos:', fr: 'Survivez aux coups :', it: 'Sopravvivi mosse:', pt: 'Sobreviva jogadas:', nl: 'Overleef zetten:', no: 'Overlev trekk:', da: 'Overlev træk:', fi: 'Selviä siirroista:' };
      return `${labels[settings.language] ?? labels.en} ${level.goal.moves}`;
    }
    if (level.goal.type === 'hidden-word') return hiddenLabels[settings.language] ?? hiddenLabels.en;
    if (level.goal.type === 'best-word-score') {
      const labels: Record<string, string> = { en: 'Best word ≥', sv: 'Bästa ord ≥', de: 'Bestes Wort ≥', es: 'Mejor palabra ≥', fr: 'Meilleur mot ≥', it: 'Miglior parola ≥', pt: 'Melhor palavra ≥', nl: 'Beste woord ≥', no: 'Beste ord ≥', da: 'Bedste ord ≥', fi: 'Paras sana ≥' };
      return `${labels[settings.language] ?? labels.en} ${level.goal.target}`;
    }
    if (level.goal.type === 'destroy-asteroids') {
      const labels: Record<string, string> = { en: 'Destroy asteroids:', sv: 'Förstör asteroider:', de: 'Zerstöre Asteroiden:', es: 'Destruye asteroides:', fr: 'Détruire astéroïdes :', it: 'Distruggi asteroidi:', pt: 'Destruir asteroides:', nl: 'Vernietig asteroïden:', no: 'Ødelegg asteroider:', da: 'Ødelæg asteroider:', fi: 'Tuhoa asteroideja:' };
      return `☄️ ${labels[settings.language] ?? labels.en} ${level.goal.count}`;
    }
    return t.goalFindWords;
  })();

  const progressPct = (() => {
    if (!level.showProgressBar) return null;
    if (level.goal.type === 'reach-score') return Math.min(100, Math.round((game.score / level.goal.target) * 100));
    if (level.goal.type === 'survive-moves') return Math.min(100, Math.round((game.movesUsed / level.goal.moves) * 100));
    if (level.goal.type === 'best-word-score') return Math.min(100, Math.round(((game.bestWordScore ?? 0) / level.goal.target) * 100));
    if (level.goal.type === 'destroy-asteroids') return Math.min(100, Math.round(((game.asteroidsDestroyed ?? 0) / level.goal.count) * 100));
    return null;
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
          {level.goal.type === 'hidden-word' && (
            <>
              {/* Ledtrådsord ovan */}
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {hiddenThematic.map(w => {
                  const found = game.usedWords.some(u => u.word.toLowerCase() === w);
                  return (
                    <span
                      key={w}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${found ? 'line-through text-emerald-300' : 'text-white/80'}`}
                      style={{ background: found ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)' }}
                    >
                      {w.toUpperCase()}
                    </span>
                  );
                })}
              </div>
              {/* Det dolda ordet */}
              <div className="flex gap-1.5 justify-center mt-2 font-mono">
                {hiddenWord.split('').map((ch, i) => (
                  <span
                    key={i}
                    className={`w-7 h-9 flex items-center justify-center rounded-md text-base font-bold border-b-2 ${i < hiddenFoundCount ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10' : 'border-white/40 text-white/30 bg-white/5'}`}
                  >
                    {i < hiddenFoundCount ? ch : '_'}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-white/60 mt-1.5">
                {hiddenFoundCount} / {hiddenWord.length}
                {hiddenFoundCount >= hiddenWord.length && (
                  <span className="block mt-1 text-emerald-300 font-bold animate-pulse">
                    {settings.language === 'sv' ? `Skapa nu ordet ${hiddenWord} på brädet!` : `Now form ${hiddenWord} on the board!`}
                  </span>
                )}
              </div>
            </>
          )}
          {progressPct !== null && (
            <div className="mt-2 px-1">
              <Progress value={progressPct} className="h-2 bg-white/10" />
              <div className="text-[11px] text-white/70 mt-1">
                {level.goal.type === 'reach-score' && `${game.score} / ${level.goal.target}`}
                {level.goal.type === 'survive-moves' && `${game.movesUsed} / ${level.goal.moves}`}
                {level.goal.type === 'best-word-score' && `${game.bestWordScore ?? 0} / ${level.goal.target}`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rocket powerup bar */}
      {(level.freeRockets ?? 0) > 0 && (
        <div className="w-full max-w-md px-3 pb-2 flex items-center justify-center gap-2">
          <Button
            onClick={() => setRocketArming(v => !v)}
            disabled={rocketsLeft <= 0}
            className={`gap-2 ${rocketArming ? 'bg-orange-500 hover:bg-orange-400' : 'bg-indigo-600 hover:bg-indigo-500'} text-white disabled:opacity-40`}
          >
            <Rocket className="w-4 h-4" />
            {rocketArming
              ? (settings.language === 'sv' ? 'Välj kolumn…' : 'Pick a column…')
              : `🚀 × ${rocketsLeft}`}
          </Button>
          {rocketArming && (
            <Button onClick={() => setRocketArming(false)} variant="outline" size="sm" className="gap-1 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      <div className={`flex items-center justify-center w-full ${rocketArming ? 'ring-4 ring-orange-400/60 ring-offset-0 rounded-xl' : ''}`}>
        <GameBoard
          ref={boardRef}
          grid={game.grid}
          selectedBubble={game.selectedBubble}
          poppingCells={game.poppingCells}
          onBubbleClick={handleBubbleClick}
          onSwipe={rocketArming ? undefined : game.handleSwipe}
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
          mode={levelMode}
          bestWordScore={game.bestWordScore}
          bestWord={game.bestWord}
          freeMovesRemaining={game.freeMovesRemaining}
          hideBadge
        />
      </div>

      <InGameMenu open={showMenu} onClose={() => setShowMenu(false)} onBackToMap={() => { setShowMenu(false); navigate('/adventure'); }} />

      {/* Tutorial / intro modal — shown every time in adventure */}
      <TutorialModal
        open={showIntro}
        steps={[
          {
            title: `${level.icon} ${level.name[settings.language]}`,
            body: `${level.intro[settings.language]}\n\n🎯 ${goalText}`,
          },
          ...getTutorialSteps(levelMode, settings.language),
        ]}
        onClose={() => setShowIntro(false)}
      />

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
