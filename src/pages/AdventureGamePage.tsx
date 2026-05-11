import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { useCoins } from '@/hooks/useCoins';
import { useUnlocks } from '@/hooks/useUnlocks';
import { isForestSecretWord } from '@/data/secretUnlocks';
import { useSfx } from '@/hooks/useSfx';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { GameBoard, type GameBoardHandle } from '@/components/game/GameBoard';
import { useGameEffects } from '@/hooks/useGameEffects';
import { LightningOverlay } from '@/components/game/LightningOverlay';
import { GameInfo } from '@/components/game/GameInfo';
import { InGameMenu } from '@/components/game/InGameMenu';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Menu, Trophy, Map as MapIcon, RotateCcw, Play, Video, Home, Rocket, X, Zap } from 'lucide-react';
import { getLevelById, adventureLevels } from '@/data/adventureLevels';
import { useAdventureProgress } from '@/hooks/useAdventureProgress';
import { useAds } from '@/hooks/useAds';
import { useSavedGame } from '@/hooks/useSavedGame';
import { TutorialModal, type TutorialStep } from '@/components/TutorialModal';
import { getLevelConcepts, getConceptSteps } from '@/data/adventureConcepts';
import { useSeenAdventureConcepts } from '@/hooks/useSeenAdventureConcepts';
import { getLanguageConfig } from '@/data/languages';

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
    const satellite = level.satellite === true;
    const ufos = level.ufos === true;
    const collapsingCave = level.collapsingCave === true;
    const infection = level.infection === true;
    const startPowerups = level.startPowerups;
    const presetGrid = level.presetGrid?.[settings.language];
    const maxMoves = level.maxMovesByLang?.[settings.language] ?? level.maxMoves;
    const extras = { antigravity, asteroids, satellite, ufos, collapsingCave, presetGrid, infection, startPowerups };
    if (level.goal.type === 'find-words') {
      const words = level.goal.words[settings.language];
      return { targetWords: words, maxMoves, keepFormableWords: words, ...extras };
    }
    if (level.goal.type === 'hidden-word') {
      const thematic = level.goal.thematicWords[settings.language];
      const hidden = level.goal.hiddenWord[settings.language];
      return { targetWords: thematic, maxMoves, keepFormableWords: [hidden, ...thematic], ...extras };
    }
    if (level.goal.type === 'two-hidden-words') {
      const thematic = level.goal.thematicWords[settings.language];
      const h1 = level.goal.hiddenWord1[settings.language];
      const h2 = level.goal.hiddenWord2[settings.language];
      return { targetWords: thematic, maxMoves, keepFormableWords: [h1, h2, ...thematic], ...extras };
    }
    if (level.goal.type === 'single-word') {
      const w = level.goal.word[settings.language];
      return { targetWords: [w], maxMoves, keepFormableWords: [w], ...extras };
    }
    if (maxMoves || antigravity || asteroids || satellite || ufos || collapsingCave || presetGrid || infection || startPowerups) {
      return { targetWords: [] as string[], maxMoves, ...extras };
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
  const { isSeen, markSeen } = useSeenAdventureConcepts();
  const [showMenu, setShowMenu] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [ready, setReady] = useState(false);
  const boardRef = useRef<GameBoardHandle | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);
  const getCellRect = useCallback((row: number, col: number) => boardRef.current?.getCellRect(row, col) ?? null, []);
  const { lightning } = useGameEffects({
    lastWordEvent: game.lastWordEvent,
    movesUsed: game.movesUsed,
    getCellRect,
    containerEl: boardWrapperRef.current,
  });
  const [rocketsLeft, setRocketsLeft] = useState(level?.freeRockets ?? 0);
  const [rocketArming, setRocketArming] = useState(false);
  // Adventure 3-3 free powerups (toolbar buttons, like rockets)
  const initialSwapLetters = useMemo(
    () => (level?.startPowerups ?? []).filter(p => p === 'swapletter').length,
    [level?.id, level?.startPowerups]
  );
  const initialSwapColors = useMemo(
    () => (level?.startPowerups ?? []).filter(p => p === 'swapcolor').length,
    [level?.id, level?.startPowerups]
  );
  const [swapLettersLeft, setSwapLettersLeft] = useState(initialSwapLetters);
  const [swapColorsLeft, setSwapColorsLeft] = useState(initialSwapColors);
  const [swapArming, setSwapArming] = useState<null | 'letter' | 'color'>(null);
  const [swapTarget, setSwapTarget] = useState<{ row: number; col: number } | null>(null);
  const [swapNewLetter, setSwapNewLetter] = useState<string>('');
  const [swapNewColor, setSwapNewColor] = useState<import('@/data/gameConstants').BubbleColor | null>(null);

  // Laser (satellite levels)
  const LASER_INTERVAL = 5;
  const [laserCharge, setLaserCharge] = useState(0); // 0..LASER_INTERVAL
  const [laserArming, setLaserArming] = useState(false);
  const [laserDud, setLaserDud] = useState(false); // armed but satellite not charged → red laser, no popup
  const [laserTarget, setLaserTarget] = useState<{ row: number; col: number; letter: string } | null>(null);
  const [laserNewLetter, setLaserNewLetter] = useState<string>('');
  const [laserShot, setLaserShot] = useState<{ row: number; col: number; color: 'green' | 'red'; id: string } | null>(null);
  const prevMovesUsedRef = useRef(0);
  const laserReady = laserCharge >= LASER_INTERVAL;

  // Track moves to charge the laser
  useEffect(() => {
    if (!level?.satellite) return;
    const delta = game.movesUsed - prevMovesUsedRef.current;
    prevMovesUsedRef.current = game.movesUsed;
    if (delta > 0 && !laserReady) {
      setLaserCharge(c => Math.min(LASER_INTERVAL, c + delta));
    }
  }, [game.movesUsed, level?.satellite, laserReady]);

  // Reset laser on level change
  useEffect(() => {
    setLaserCharge(0); setLaserArming(false); setLaserDud(false); setLaserTarget(null); setLaserNewLetter(''); setLaserShot(null);
    prevMovesUsedRef.current = 0;
  }, [level?.id]);

  useEffect(() => { setSwapLettersLeft(initialSwapLetters); setSwapColorsLeft(initialSwapColors); setSwapArming(null); setSwapTarget(null); }, [level?.id, initialSwapLetters, initialSwapColors]);

  // Restart helper: resets game AND refills starting powerups to their initial counts.
  const restartLevel = () => {
    game.resetGame();
    setSwapLettersLeft(initialSwapLetters);
    setSwapColorsLeft(initialSwapColors);
    setSwapArming(null);
    setSwapTarget(null);
    setRocketsLeft(level?.freeRockets ?? 0);
    setRocketArming(false);
  };

  useEffect(() => { setRocketsLeft(level?.freeRockets ?? 0); setRocketArming(false); }, [level?.id, level?.freeRockets]);

  // Unlock shop item simply by reaching this level (e.g. Moon background on Moon Landing).
  useEffect(() => {
    if (level?.unlocksShopItem) unlock(level.unlocksShopItem);
  }, [level?.id, level?.unlocksShopItem, unlock]);

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
    if (!level) return [];
    if (level.goal.type === 'hidden-word' || level.goal.type === 'two-hidden-words') {
      return level.goal.thematicWords[settings.language].map(w => w.toLowerCase());
    }
    return [];
  }, [level, settings.language]);

  // Two-hidden-words data
  const twoHidden = useMemo<{ w1: string; w2: string } | null>(() => {
    if (!level || level.goal.type !== 'two-hidden-words') return null;
    return {
      w1: level.goal.hiddenWord1[settings.language].toUpperCase(),
      w2: level.goal.hiddenWord2[settings.language].toUpperCase(),
    };
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
    } else if (level.goal.type === 'two-hidden-words') {
      const h1 = level.goal.hiddenWord1[settings.language];
      const h2 = level.goal.hiddenWord2[settings.language];
      const thematic = level.goal.thematicWords[settings.language].filter(w => !used.has(w.toLowerCase()));
      remaining = [
        ...(used.has(h1.toLowerCase()) ? [] : [h1]),
        ...(used.has(h2.toLowerCase()) ? [] : [h2]),
        ...thematic,
      ];
    } else if (level.goal.type === 'single-word') {
      const w = level.goal.word[settings.language];
      remaining = used.has(w.toLowerCase()) ? [] : [w];
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
    if (level.goal.type === 'find-words') {
      const wordsDone = foundTargets.length >= targetWords.length && targetWords.length > 0;
      const scoreDone = level.goal.minScore == null || game.score >= level.goal.minScore;
      done = wordsDone && scoreDone;
    }
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
    else if (level.goal.type === 'single-word') {
      const target = level.goal.word[settings.language].toLowerCase();
      done = game.usedWords.some(w => w.word.toLowerCase() === target);
    }
    else if (level.goal.type === 'two-hidden-words' && twoHidden) {
      const used = new Set(game.usedWords.map(w => w.word.toLowerCase()));
      done = used.has(twoHidden.w1.toLowerCase()) && used.has(twoHidden.w2.toLowerCase());
    }
    if (done) {
      setShowSuccess(true);
      addCoins(20);
      markCompleted(level.id);
      if (level.unlocksShopItem) unlock(level.unlocksShopItem);
    }
  }, [game.score, game.usedWords, game.movesUsed, game.asteroidsDestroyed, foundTargets, targetWords, hiddenFoundCount, hiddenWord, twoHidden, level, showSuccess, ready, settings.language, addCoins, markCompleted, unlock]);

  useEffect(() => { if (game.lastFoundWord) playWordFound(); }, [game.lastFoundWord, playWordFound]);
  useEffect(() => { if (game.lastFoundWord && isForestSecretWord(game.lastFoundWord)) unlock('bg-forest'); }, [game.lastFoundWord, unlock]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    if (rocketArming) {
      if (rocketsLeft > 0 && game.fireRocket) {
        game.fireRocket(col);
        setRocketsLeft(n => n - 1);
      }
      setRocketArming(false);
      return;
    }
    if (swapArming) {
      const cell = game.grid[row]?.[col];
      if (cell && !cell.satellite && !cell.asteroid && !cell.ufo && !cell.rock && !cell.dead) {
        setSwapTarget({ row, col });
        setSwapNewLetter(cell.letter);
        setSwapNewColor(cell.color);
      }
      return;
    }
    if (laserDud) {
      const cell = game.grid[row]?.[col];
      if (cell && !cell.satellite) {
        setLaserShot({ row, col, color: 'red', id: `red-${Date.now()}` });
      }
      setLaserDud(false);
      return;
    }
    if (laserArming) {
      const cell = game.grid[row]?.[col];
      if (cell && !cell.satellite && !cell.asteroid) {
        setLaserTarget({ row, col, letter: cell.letter });
        setLaserNewLetter(cell.letter);
      }
      return;
    }
    game.handleBubbleClick(row, col);
  }, [game, rocketArming, rocketsLeft, laserArming, laserDud, swapArming]);

  const handleSatelliteClick = useCallback(() => {
    if (rocketArming) return;
    if (laserReady) {
      setLaserArming(true);
      setLaserDud(false);
    } else {
      // Not charged: arm a "dud" — next bubble click fires red laser only.
      setLaserDud(true);
      setLaserArming(false);
    }
  }, [laserReady, rocketArming]);

  // Build alphabet for the language (sorted, unique)
  const alphabet = useMemo(() => {
    const cfg = getLanguageConfig(settings.language);
    const set = new Set(cfg.letterPool.split('').map(c => c.toUpperCase()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, settings.language));
  }, [settings.language]);

  const fireLaser = useCallback(() => {
    if (!laserTarget || !laserNewLetter) return;
    const target = laserTarget;
    const newLetter = laserNewLetter;
    // Show green laser beam first; the bubble's letter changes mid-beam so player sees the swap.
    setLaserShot({ row: target.row, col: target.col, color: 'green', id: `green-${Date.now()}` });
    setLaserTarget(null);
    setLaserNewLetter('');
    setLaserArming(false);
    setLaserDud(false);
    setLaserCharge(0);
    setTimeout(() => {
      game.swapBubbleLetter?.(target.row, target.col, newLetter);
    }, 250);
  }, [laserTarget, laserNewLetter, game]);

  const cancelLaserDialog = useCallback(() => {
    setLaserTarget(null);
    setLaserNewLetter('');
    // Stay armed: player can pick another bubble. They can also click the cancel button on the toolbar to fully cancel.
  }, []);

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
    if (level.goal.type === 'two-hidden-words') {
      const labels: Record<string, string> = { en: 'Reveal TWO hidden words:', sv: 'Avslöja TVÅ dolda ord:', de: 'Enthülle ZWEI versteckte Wörter:', es: 'Revela DOS palabras ocultas:', fr: 'Révélez DEUX mots cachés :', it: 'Rivela DUE parole nascoste:', pt: 'Revela DUAS palavras ocultas:', nl: 'Onthul TWEE verborgen woorden:', no: 'Avslør TO skjulte ord:', da: 'Afslør TO skjulte ord:', fi: 'Paljasta KAKSI salaista sanaa:' };
      return labels[settings.language] ?? labels.en;
    }
    if (level.goal.type === 'best-word-score') {
      const labels: Record<string, string> = { en: 'Best word ≥', sv: 'Bästa ord ≥', de: 'Bestes Wort ≥', es: 'Mejor palabra ≥', fr: 'Meilleur mot ≥', it: 'Miglior parola ≥', pt: 'Melhor palavra ≥', nl: 'Beste woord ≥', no: 'Beste ord ≥', da: 'Bedste ord ≥', fi: 'Paras sana ≥' };
      return `${labels[settings.language] ?? labels.en} ${level.goal.target}`;
    }
    if (level.goal.type === 'single-word') {
      const labels: Record<string, string> = { en: 'Find', sv: 'Hitta', de: 'Finde', es: 'Encuentra', fr: 'Trouve', it: 'Trova', pt: 'Encontra', nl: 'Vind', no: 'Finn', da: 'Find', fi: 'Löydä' };
      return `🔦 ${labels[settings.language] ?? labels.en} ${level.goal.word[settings.language].toUpperCase()}`;
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
            <>
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
              {level.goal.minScore != null && (
                <div className="mt-2 px-1">
                  <Progress value={Math.min(100, Math.round((game.score / level.goal.minScore) * 100))} className="h-2 bg-white/10" />
                  <div className="text-[11px] text-white/70 mt-1">{game.score} / {level.goal.minScore}</div>
                </div>
              )}
            </>
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
          {level.goal.type === 'two-hidden-words' && twoHidden && (() => {
            const usedSet = new Set(game.usedWords.map(u => u.word.toLowerCase()));
            const distinctThematicFound = new Set(
              game.usedWords.map(u => u.word.toLowerCase()).filter(w => hiddenThematic.includes(w))
            ).size;
            const total = twoHidden.w1.length + twoHidden.w2.length;
            const w1Count = Math.min(distinctThematicFound, twoHidden.w1.length);
            const w2Count = Math.max(0, Math.min(distinctThematicFound - twoHidden.w1.length, twoHidden.w2.length));
            const w1Done = usedSet.has(twoHidden.w1.toLowerCase());
            const w2Done = usedSet.has(twoHidden.w2.toLowerCase());
            return (
              <>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {hiddenThematic.map(w => {
                    const found = usedSet.has(w);
                    return (
                      <span key={w} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${found ? 'line-through text-emerald-300' : 'text-white/80'}`} style={{ background: found ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)' }}>
                        {w.toUpperCase()}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-1.5 justify-center mt-2 font-mono">
                  {twoHidden.w1.split('').map((ch, i) => (
                    <span key={`w1-${i}`} className={`w-7 h-9 flex items-center justify-center rounded-md text-base font-bold border-b-2 ${w1Done ? 'border-emerald-500 text-emerald-200 bg-emerald-500/20' : i < w1Count ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10' : 'border-white/40 text-white/30 bg-white/5'}`}>
                      {(w1Done || i < w1Count) ? ch : '_'}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5 justify-center mt-1.5 font-mono">
                  {twoHidden.w2.split('').map((ch, i) => (
                    <span key={`w2-${i}`} className={`w-7 h-9 flex items-center justify-center rounded-md text-base font-bold border-b-2 ${w2Done ? 'border-emerald-500 text-emerald-200 bg-emerald-500/20' : i < w2Count ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10' : 'border-white/40 text-white/30 bg-white/5'}`}>
                      {(w2Done || i < w2Count) ? ch : '_'}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-white/60 mt-1.5">
                  {Math.min(distinctThematicFound, total)} / {total}
                  {(w1Count >= twoHidden.w1.length && !w1Done) && (
                    <span className="block mt-1 text-emerald-300 font-bold animate-pulse">
                      {settings.language === 'sv' ? `Skapa nu ${twoHidden.w1}!` : `Now form ${twoHidden.w1}!`}
                    </span>
                  )}
                  {(w2Count >= twoHidden.w2.length && !w2Done) && (
                    <span className="block mt-1 text-emerald-300 font-bold animate-pulse">
                      {settings.language === 'sv' ? `Skapa nu ${twoHidden.w2}!` : `Now form ${twoHidden.w2}!`}
                    </span>
                  )}
                </div>
              </>
            );
          })()}
          {progressPct !== null && (
            <div className="mt-2 px-1">
              <Progress value={progressPct} className="h-2 bg-white/10" />
              <div className="text-[11px] text-white/70 mt-1">
                {level.goal.type === 'reach-score' && `${game.score} / ${level.goal.target}`}
                {level.goal.type === 'survive-moves' && `${game.movesUsed} / ${level.goal.moves}`}
                {level.goal.type === 'best-word-score' && `${game.bestWordScore ?? 0} / ${level.goal.target}`}
                {level.goal.type === 'destroy-asteroids' && `${game.asteroidsDestroyed ?? 0} / ${level.goal.count}`}
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

      {/* Laser powerup bar (satellite levels) */}
      {level.satellite && (
        <div className="w-full max-w-md px-3 pb-2 flex items-center justify-center gap-2">
          <Button
            onClick={() => { if (laserReady) setLaserArming(v => !v); }}
            disabled={!laserReady}
            className={`gap-2 ${laserArming ? 'bg-orange-500 hover:bg-orange-400' : laserReady ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700'} text-white disabled:opacity-60`}
          >
            <Zap className="w-4 h-4" />
            {laserArming
              ? (settings.language === 'sv' ? 'Välj bubbla…' : 'Pick a bubble…')
              : laserReady
                ? (settings.language === 'sv' ? '🛰️ Laser klar' : '🛰️ Laser ready')
                : `🛰️ ${laserCharge}/${LASER_INTERVAL}`}
          </Button>
          {laserArming && (
            <Button onClick={() => setLaserArming(false)} variant="outline" size="sm" className="gap-1 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Free swap-letter / swap-color powerups (Adventure 3+) */}
      {(initialSwapLetters > 0 || initialSwapColors > 0) && (
        <div className="w-full max-w-md px-3 pb-2 flex items-center justify-center gap-2">
          {initialSwapLetters > 0 && (
            <Button
              onClick={() => setSwapArming(swapArming === 'letter' ? null : 'letter')}
              disabled={swapLettersLeft <= 0}
              className={`gap-2 ${swapArming === 'letter' ? 'bg-orange-500 hover:bg-orange-400' : 'bg-blue-600 hover:bg-blue-500'} text-white disabled:opacity-40`}
            >
              {swapArming === 'letter'
                ? (settings.language === 'sv' ? 'Välj bricka…' : 'Pick a tile…')
                : `🔤 × ${swapLettersLeft}`}
            </Button>
          )}
          {initialSwapColors > 0 && (
            <Button
              onClick={() => setSwapArming(swapArming === 'color' ? null : 'color')}
              disabled={swapColorsLeft <= 0}
              className={`gap-2 ${swapArming === 'color' ? 'bg-orange-500 hover:bg-orange-400' : 'bg-purple-600 hover:bg-purple-500'} text-white disabled:opacity-40`}
            >
              {swapArming === 'color'
                ? (settings.language === 'sv' ? 'Välj bricka…' : 'Pick a tile…')
                : `🎨 × ${swapColorsLeft}`}
            </Button>
          )}
          {swapArming && (
            <Button onClick={() => setSwapArming(null)} variant="outline" size="sm" className="gap-1 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      <FireModeFrame active={fireMode}>
        <div ref={boardWrapperRef} className={`relative flex items-center justify-center w-full ${rocketArming ? 'ring-4 ring-orange-400/60 ring-offset-0 rounded-xl' : laserArming ? 'ring-4 ring-emerald-400/60 ring-offset-0 rounded-xl' : swapArming ? 'ring-4 ring-purple-400/60 ring-offset-0 rounded-xl' : ''}`}>
          <GameBoard
            ref={boardRef}
            grid={game.grid}
            selectedBubble={game.selectedBubble}
            poppingCells={game.poppingCells}
            onBubbleClick={handleBubbleClick}
            onSwipe={(rocketArming || laserArming || swapArming) ? undefined : game.handleSwipe}
            bonusPopups={game.bonusPopups}
            onBonusPopupDone={game.removeBonusPopup}
            laserCharge={level.satellite ? { ready: laserReady, current: laserCharge, max: LASER_INTERVAL, arming: laserArming || laserDud } : undefined}
            onSatelliteClick={level.satellite ? handleSatelliteClick : undefined}
            laserShot={laserShot}
          />
          <LightningOverlay event={lightning} getCellRect={getCellRect} containerEl={boardWrapperRef.current} />
        </div>
      </>

      <div className="w-full pt-1.5 pb-4">
        <GameInfo
          movesLeft={game.movesLeft}
          score={game.score}
          lastFoundWord={game.lastFoundWord}
          onResetGame={restartLevel}
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

      {/* Tutorial / intro modal — narrative storyIntro + level-specific goal,
           plus concept tutorials only the FIRST time each concept appears. */}
      {(() => {
        const conceptIds = level.hideModeTutorial ? [] : getLevelConcepts(level);
        const unseenConcepts = conceptIds.filter(id => !isSeen(id));
        const conceptSteps = unseenConcepts.flatMap(id => getConceptSteps(id, settings.language));
        return (
          <TutorialModal
            open={showIntro}
            steps={[
              ...((level.storyIntro ?? []).map((card) => ({
                title: card.title[settings.language] ?? card.title.en ?? '',
                body: card.body[settings.language] ?? card.body.en ?? '',
              }))),
              {
                title: `${level.icon} ${level.name[settings.language]}`,
                body: `${level.intro[settings.language]}\n\n🎯 ${goalText}`,
              },
              ...conceptSteps,
            ]}
            onClose={() => {
              setShowIntro(false);
              if (unseenConcepts.length) markSeen(unseenConcepts);
            }}
          />
        );
      })()}

      {/* Success modal */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="max-w-xs rounded-2xl border-emerald-500/30" style={{ background: 'linear-gradient(135deg, rgba(20,80,40,0.95), rgba(10,40,20,0.95))' }}>
          <DialogHeader>
            <DialogTitle className="text-white text-center text-2xl flex items-center justify-center gap-2">
              {level.finalCelebration
                ? <span>🎈 {settings.language === 'sv' ? 'Vi tog luftballong hem!' : 'We took a hot-air balloon home!'}</span>
                : <><Trophy className="w-7 h-7 text-yellow-400" /> {t.adventureCongrats}</>}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-center pt-2">
              {level.finalCelebration
                ? (settings.language === 'sv' ? 'Nya äventyr väntar senare. +20 mynt' : 'New adventures await later. +20 coins')
                : `${t.adventureLevelComplete} +20 coins`}
            </DialogDescription>
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
            <Button onClick={() => { setShowSuccess(false); restartLevel(); }} variant="ghost" className="w-full gap-2 text-white/80 hover:text-white hover:bg-white/10">
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
            <Button onClick={restartLevel} variant="outline" className="w-full gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
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

      {/* Laser letter-swap dialog */}
      <Dialog open={!!laserTarget} onOpenChange={(open) => { if (!open) cancelLaserDialog(); }}>
        <DialogContent className="max-w-sm rounded-2xl border-emerald-500/30" style={{ background: 'linear-gradient(135deg, rgba(15,30,55,0.97), rgba(8,18,35,0.97))' }}>
          <DialogHeader>
            <DialogTitle className="text-white text-center text-xl flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              {settings.language === 'sv' ? 'Byt ut bokstav' : 'Swap letter'}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-center text-xs">
              {settings.language === 'sv' ? 'Välj ny bokstav. Färgen behålls.' : 'Pick a new letter. Color stays the same.'}
            </DialogDescription>
          </DialogHeader>

          {laserTarget && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white"
                   style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)' }}>
                {laserTarget.letter}
              </div>
              <span className="text-white/80 text-2xl">→</span>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white"
                   style={{ background: 'hsl(140, 65%, 42%)', border: '2px solid hsl(140,90%,60%)', boxShadow: '0 0 14px hsl(140,90%,55%)' }}>
                {laserNewLetter || '?'}
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-1.5 py-1">
            {alphabet.map(letter => {
              const selected = laserNewLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setLaserNewLetter(letter)}
                  className={`aspect-square rounded-md font-bold text-sm transition-all ${selected ? 'bg-emerald-500 text-white scale-110 shadow-[0_0_10px_hsl(140,90%,50%)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-2">
            <Button onClick={cancelLaserDialog} variant="outline" className="flex-1 gap-1 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <X className="w-4 h-4" />
              {settings.language === 'sv' ? 'Avbryt' : 'Cancel'}
            </Button>
            <Button onClick={fireLaser} disabled={!laserNewLetter || laserNewLetter === laserTarget?.letter} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Free swap-letter / swap-color dialog (Adventure 3+) */}
      <Dialog open={!!swapTarget} onOpenChange={(open) => { if (!open) { setSwapTarget(null); } }}>
        <DialogContent className="max-w-sm rounded-2xl border-purple-500/30" style={{ background: 'linear-gradient(135deg, rgba(40,15,55,0.97), rgba(20,8,35,0.97))' }}>
          <DialogHeader>
            <DialogTitle className="text-white text-center text-xl">
              {swapArming === 'color'
                ? (settings.language === 'sv' ? '🎨 Byt färg' : '🎨 Swap color')
                : (settings.language === 'sv' ? '🔤 Byt bokstav' : '🔤 Swap letter')}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-center text-xs">
              {swapArming === 'color'
                ? (settings.language === 'sv' ? 'Välj ny färg på vald bricka.' : 'Pick a new color for the selected tile.')
                : (settings.language === 'sv' ? 'Välj ny bokstav. Färgen behålls.' : 'Pick a new letter. Color stays.')}
            </DialogDescription>
          </DialogHeader>

          {swapArming === 'color' ? (
            <div className="grid grid-cols-5 gap-2 py-3">
              {(['red','green','blue','yellow','pink'] as const).map(c => {
                const styles = { red: 'hsl(0,75%,50%)', green: 'hsl(140,65%,42%)', blue: 'hsl(210,80%,52%)', yellow: 'hsl(45,90%,52%)', pink: 'hsl(330,75%,58%)' }[c];
                const sel = swapNewColor === c;
                return (
                  <button key={c} onClick={() => setSwapNewColor(c)} className={`aspect-square rounded-full transition-all ${sel ? 'scale-110 ring-4 ring-white' : 'opacity-80'}`} style={{ background: styles, boxShadow: sel ? `0 0 14px ${styles}` : '0 2px 4px rgba(0,0,0,0.3)' }} />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 py-1">
              {alphabet.map(letter => {
                const selected = swapNewLetter === letter;
                return (
                  <button key={letter} onClick={() => setSwapNewLetter(letter)} className={`aspect-square rounded-md font-bold text-sm transition-all ${selected ? 'bg-purple-500 text-white scale-110 shadow-[0_0_10px_hsl(280,90%,60%)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button onClick={() => { setSwapTarget(null); }} variant="outline" className="flex-1 gap-1 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <X className="w-4 h-4" />{settings.language === 'sv' ? 'Avbryt' : 'Cancel'}
            </Button>
            <Button
              onClick={() => {
                if (!swapArming || !swapTarget) return;
                if (swapArming === 'color' && swapNewColor) {
                  game.swapBubbleColor?.(swapTarget.row, swapTarget.col, swapNewColor);
                  setSwapColorsLeft(n => Math.max(0, n - 1));
                } else if (swapArming === 'letter' && swapNewLetter) {
                  game.swapBubbleLetter?.(swapTarget.row, swapTarget.col, swapNewLetter);
                  setSwapLettersLeft(n => Math.max(0, n - 1));
                }
                setSwapTarget(null);
                setSwapArming(null);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
            >OK</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdventureGamePage;
