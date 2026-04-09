import type { BubbleData } from '@/data/gameConstants';

export type MPMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';
export type MatchPlayerSlot = 'player1' | 'player2';
export type MatchPhase = 'ready' | 'awaiting_ai' | 'review' | 'between_rounds' | 'match_over';

export interface MatchWordEntry {
  word: string;
  score: number;
}

export interface MatchTurnPlan {
  player: MatchPlayerSlot;
  moves: number;
}

export interface MatchTurnResult {
  player: MatchPlayerSlot;
  moves: number;
  score: number;
  words: MatchWordEntry[];
  bestWord: string | null;
  bestWordScore: number;
  finalGrid: BubbleData[][];
  completedAt: string;
}

export interface MatchRoundState {
  roundNumber: number;
  starter: MatchPlayerSlot;
  sharedWords: boolean;
  sharedBoard: boolean;
  started: boolean;
  completed: boolean;
  startingGrid: BubbleData[][];
  currentGrid: BubbleData[][];
  currentSubTurnIndex: number;
  subTurns: MatchTurnPlan[];
  results: MatchTurnResult[];
  sharedUsedWords: string[];
}

export interface MatchProgressState {
  version: 1;
  mode: MPMode;
  starter: MatchPlayerSlot;
  rounds: MatchRoundState[];
  phase: MatchPhase;
  nextActionFor: MatchPlayerSlot | null;
  lastActor: MatchPlayerSlot | null;
  reviewRound: number | null;
}

export interface RoundScoreSummary {
  player1Score: number;
  player2Score: number;
  player1Words: MatchWordEntry[];
  player2Words: MatchWordEntry[];
  player1BestWord: string | null;
  player2BestWord: string | null;
  player1BestWordScore: number;
  player2BestWordScore: number;
}

export interface HeadToHeadStats {
  wins: number;
  losses: number;
  draws: number;
}
