import { BUBBLE_COLORS, REDUCED_COLORS, createGrid } from '@/data/gameConstants';
import { getLanguageConfig, type GameLanguage } from '@/data/languages';
import { getRoundStarter, getRoundSubTurns, getTotalRounds, usesSharedBoard, usesSharedWords } from './rules';
import type {
  MatchPlayerSlot,
  MatchProgressState,
  MatchRoundState,
  MatchTurnResult,
  MPMode,
  RoundScoreSummary,
} from './types';

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneGrid<T>(grid: T): T {
  return cloneValue(grid);
}

function createRoundState(mode: MPMode, language: GameLanguage, roundNumber: number, starter: MatchPlayerSlot): MatchRoundState {
  const langConfig = getLanguageConfig(language);
  const colors = mode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
  const startingGrid = createGrid(colors, langConfig.letterPool, langConfig.letterValues);

  return {
    roundNumber,
    starter,
    sharedWords: usesSharedWords(mode),
    sharedBoard: usesSharedBoard(mode),
    started: roundNumber === 1,
    completed: false,
    startingGrid: cloneGrid(startingGrid),
    currentGrid: cloneGrid(startingGrid),
    currentSubTurnIndex: 0,
    subTurns: getRoundSubTurns(mode, starter),
    results: [],
    sharedUsedWords: [],
  };
}

export function createMatchProgress(mode: MPMode, language: GameLanguage, starter: MatchPlayerSlot): MatchProgressState {
  const rounds = Array.from({ length: getTotalRounds(mode) }, (_, index) => {
    const roundNumber = index + 1;
    return createRoundState(mode, language, roundNumber, getRoundStarter(mode, starter, roundNumber));
  });

  return {
    version: 1,
    mode,
    starter,
    rounds,
    phase: rounds[0].starter === 'player1' ? 'ready' : 'awaiting_ai',
    nextActionFor: rounds[0].starter,
    lastActor: null,
    reviewRound: null,
  };
}

export function parseMatchProgress(value: unknown, fallbackMode: MPMode, language: GameLanguage): MatchProgressState {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'version' in value &&
    'rounds' in value
  ) {
    return cloneValue(value as MatchProgressState);
  }

  return createMatchProgress(fallbackMode, language, 'player1');
}

export function getCurrentRound(progress: MatchProgressState) {
  return progress.rounds.find((round) => !round.completed) ?? progress.rounds[progress.rounds.length - 1] ?? null;
}

export function getCurrentTurn(round: MatchRoundState | null) {
  if (!round || round.completed) return null;
  return round.subTurns[round.currentSubTurnIndex] ?? null;
}

export function getTurnStartingGrid(round: MatchRoundState) {
  return cloneGrid(round.sharedBoard ? round.currentGrid : round.startingGrid);
}

export function getBlockedWords(round: MatchRoundState) {
  return round.sharedWords ? [...round.sharedUsedWords] : [];
}

export function applyTurnResult(progress: MatchProgressState, roundNumber: number, result: MatchTurnResult) {
  const next = cloneValue(progress);
  const round = next.rounds.find((entry) => entry.roundNumber === roundNumber);

  if (!round) return next;

  round.started = true;
  round.results.push({
    ...result,
    finalGrid: cloneGrid(result.finalGrid),
    words: result.words.map((word) => ({ ...word })),
  });

  if (round.sharedBoard) {
    round.currentGrid = cloneGrid(result.finalGrid);
  }

  if (round.sharedWords) {
    round.sharedUsedWords = [
      ...round.sharedUsedWords,
      ...result.words.map((word) => word.word.toLowerCase()),
    ];
  }

  round.currentSubTurnIndex += 1;
  next.lastActor = result.player;
  next.reviewRound = roundNumber;

  const nextTurn = getCurrentTurn(round);
  if (nextTurn) {
    next.nextActionFor = nextTurn.player;
    next.phase = nextTurn.player === 'player2' ? 'awaiting_ai' : 'review';
    return next;
  }

  round.completed = true;
  const upcomingRound = next.rounds.find((entry) => !entry.completed);

  if (!upcomingRound) {
    next.phase = 'match_over';
    next.nextActionFor = null;
    return next;
  }

  next.phase = 'between_rounds';
  next.nextActionFor = 'player1';
  return next;
}

export function beginNextRound(progress: MatchProgressState) {
  const next = cloneValue(progress);
  const upcomingRound = next.rounds.find((entry) => !entry.completed);

  if (!upcomingRound) return next;

  upcomingRound.started = true;
  next.phase = upcomingRound.starter === 'player1' ? 'ready' : 'awaiting_ai';
  next.nextActionFor = upcomingRound.starter;
  next.lastActor = null;
  return next;
}

function summarizeForPlayer(round: MatchRoundState, player: MatchPlayerSlot) {
  const turns = round.results.filter((result) => result.player === player);
  const words = turns.flatMap((turn) => turn.words.map((word) => ({ ...word })));
  const bestEntry = turns.reduce<{ word: string | null; score: number }>(
    (best, turn) => {
      const candidateScore = turn.bestWordScore ?? 0;
      if (candidateScore > best.score) {
        return { word: turn.bestWord ?? null, score: candidateScore };
      }
      return best;
    },
    { word: null, score: 0 },
  );

  const score = progressModeScore(round, player);

  return {
    score,
    words,
    bestWord: bestEntry.word,
    bestWordScore: bestEntry.score,
  };
}

function progressModeScore(round: MatchRoundState, player: MatchPlayerSlot) {
  const turns = round.results.filter((result) => result.player === player);
  if (turns.length === 0) return 0;

  if (round.sharedBoard || round.subTurns.length === 2 && round.subTurns[0].moves === 60) {
    if (turns.some((turn) => turn.bestWordScore > 0) && round.subTurns.every((turn) => turn.moves === 60)) {
      return Math.max(...turns.map((turn) => turn.bestWordScore ?? turn.score ?? 0));
    }
  }

  return turns.reduce((sum, turn) => sum + turn.score, 0);
}

export function getRoundSummary(round: MatchRoundState, mode: MPMode): RoundScoreSummary {
  const player1Turns = round.results.filter((result) => result.player === 'player1');
  const player2Turns = round.results.filter((result) => result.player === 'player2');

  const player1Words = player1Turns.flatMap((turn) => turn.words.map((word) => ({ ...word })));
  const player2Words = player2Turns.flatMap((turn) => turn.words.map((word) => ({ ...word })));

  const player1BestWordScore = Math.max(0, ...player1Turns.map((turn) => turn.bestWordScore ?? 0));
  const player2BestWordScore = Math.max(0, ...player2Turns.map((turn) => turn.bestWordScore ?? 0));
  const player1BestWord = player1Turns.find((turn) => (turn.bestWordScore ?? 0) === player1BestWordScore)?.bestWord ?? null;
  const player2BestWord = player2Turns.find((turn) => (turn.bestWordScore ?? 0) === player2BestWordScore)?.bestWord ?? null;

  return {
    player1Score: mode === 'oneword'
      ? player1BestWordScore
      : player1Turns.reduce((sum, turn) => sum + turn.score, 0),
    player2Score: mode === 'oneword'
      ? player2BestWordScore
      : player2Turns.reduce((sum, turn) => sum + turn.score, 0),
    player1Words,
    player2Words,
    player1BestWord,
    player2BestWord,
    player1BestWordScore,
    player2BestWordScore,
  };
}

export function calculateMatchTotals(progress: MatchProgressState) {
  const summaries = progress.rounds.map((round) => getRoundSummary(round, progress.mode));

  if (progress.mode === 'oneword') {
    return {
      player1: Math.max(0, ...summaries.map((summary) => summary.player1Score)),
      player2: Math.max(0, ...summaries.map((summary) => summary.player2Score)),
    };
  }

  return summaries.reduce(
    (totals, summary) => ({
      player1: totals.player1 + summary.player1Score,
      player2: totals.player2 + summary.player2Score,
    }),
    { player1: 0, player2: 0 },
  );
}

export function getPlayerRoundData(progress: MatchProgressState, player: MatchPlayerSlot) {
  return progress.rounds.map((round) => {
    const summary = summarizeForPlayer(round, player);
    return {
      round: round.roundNumber,
      score: summary.score,
      words: summary.words,
      bestWord: summary.bestWord,
      bestWordScore: summary.bestWordScore,
    };
  });
}

export function getTurnBannerText(round: MatchRoundState) {
  const firstResult = round.results[0];
  if (round.currentSubTurnIndex === 0 && round.starter === 'player1') {
    return 'Du börjar';
  }

  if (round.currentSubTurnIndex === 1 && firstResult?.player === 'player2') {
    return 'Datorn börjar • din tur nu';
  }

  return 'Din tur nu';
}
