import type { MPMode, MatchPlayerSlot, MatchTurnPlan } from './types';

export const MODE_LABELS: Record<MPMode, string> = {
  classic: 'Classic',
  surge: 'Word Surge',
  fiveplus: '5+ Bokstäver',
  oneword: 'Längsta Ordet',
};

export function otherPlayer(player: MatchPlayerSlot): MatchPlayerSlot {
  return player === 'player1' ? 'player2' : 'player1';
}

export function getTotalRounds(mode: MPMode) {
  return mode === 'surge' ? 3 : 2;
}

export function usesSharedWords(mode: MPMode) {
  return mode === 'classic' || mode === 'fiveplus';
}

export function usesSharedBoard(mode: MPMode) {
  return mode === 'classic' || mode === 'fiveplus';
}

export function getRoundStarter(mode: MPMode, initialStarter: MatchPlayerSlot, roundNumber: number): MatchPlayerSlot {
  if (mode === 'surge') {
    return roundNumber === 2 ? otherPlayer(initialStarter) : initialStarter;
  }

  return roundNumber % 2 === 1 ? initialStarter : otherPlayer(initialStarter);
}

export function getRoundSubTurns(mode: MPMode, starter: MatchPlayerSlot): MatchTurnPlan[] {
  const opponent = otherPlayer(starter);

  if (mode === 'classic' || mode === 'fiveplus') {
    return [
      { player: starter, moves: 25 },
      { player: opponent, moves: 50 },
      { player: starter, moves: 25 },
    ];
  }

  if (mode === 'surge') {
    return [
      { player: starter, moves: 50 },
      { player: opponent, moves: 50 },
    ];
  }

  return [
    { player: starter, moves: 60 },
    { player: opponent, moves: 60 },
  ];
}
