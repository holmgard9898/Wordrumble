import type { GameMode } from '@/pages/GamePage';

interface UsedWord {
  word: string;
  score: number;
}

interface CoinBreakdown {
  base: number;
  lengthBonus: number;
  superWordBonus: number;
  enduranceBonus: number;
  total: number;
  details: string[];
}

const BASE_DIVISORS: Record<GameMode, number> = {
  classic: 100,
  surge: 120,
  bomb: 80,
  oneword: 10, // bestWordScore * 0.1
  fiveplus: 100,
};

const MAX_COINS_PER_GAME = 10;

export function calculateCoinReward(
  mode: GameMode,
  score: number,
  usedWords: UsedWord[],
  movesUsed: number,
  bestWordScore?: number,
): CoinBreakdown {
  const details: string[] = [];

  // --- Base coins ---
  let base: number;
  if (mode === 'oneword') {
    base = (bestWordScore ?? 0) * 0.1;
    if (base > 0) details.push(`Baspoäng: ${(bestWordScore ?? 0)}p × 0.1 = ${base.toFixed(2)}`);
  } else {
    base = score / BASE_DIVISORS[mode];
    if (base > 0) details.push(`Baspoäng: ${score}p / ${BASE_DIVISORS[mode]} = ${base.toFixed(2)}`);
  }

  // --- Length bonus ---
  let lengthBonus = 0;
  const isFiveplus = mode === 'fiveplus';

  for (const w of usedWords) {
    const len = w.word.length;
    if (len >= 10) {
      const bonus = isFiveplus ? 1 : 2;
      lengthBonus += bonus;
      details.push(`${w.word} (${len} bokstäver): +${bonus} 🪙`);
    } else if (len === 9) {
      const bonus = isFiveplus ? 0.5 : 1;
      lengthBonus += bonus;
      details.push(`${w.word} (9 bokstäver): +${bonus} 🪙`);
    } else if (len === 8) {
      const bonus = isFiveplus ? 0.25 : 0.5;
      lengthBonus += bonus;
      details.push(`${w.word} (8 bokstäver): +${bonus} 🪙`);
    }
  }

  // --- Super word bonus (50+ points) ---
  let superWordBonus = 0;
  for (const w of usedWords) {
    if (w.score >= 50) {
      superWordBonus += 1;
      details.push(`${w.word} (${w.score}p superord): +1 🪙`);
    }
  }

  // --- Endurance bonus (Surge & Bomb only) ---
  let enduranceBonus = 0;
  if (mode === 'surge') {
    const extraMoves = Math.max(0, movesUsed - 50);
    const bonus = Math.min(Math.floor(extraMoves / 25) * 0.5, 3);
    if (bonus > 0) {
      enduranceBonus = bonus;
      details.push(`Uthållighet: ${extraMoves} extra drag → +${bonus.toFixed(1)} 🪙`);
    }
  } else if (mode === 'bomb') {
    const bonus = Math.min(Math.floor(movesUsed / 20) * 0.5, 5);
    if (bonus > 0) {
      enduranceBonus = bonus;
      details.push(`Överlevt ${movesUsed} drag → +${bonus.toFixed(1)} 🪙`);
    }
  }

  const rawTotal = base + lengthBonus + superWordBonus + enduranceBonus;
  const total = Math.min(rawTotal, MAX_COINS_PER_GAME);

  if (rawTotal > MAX_COINS_PER_GAME) {
    details.push(`Tak: ${rawTotal.toFixed(2)} → ${MAX_COINS_PER_GAME} 🪙`);
  }

  return {
    base: Math.round(base * 100) / 100,
    lengthBonus: Math.round(lengthBonus * 100) / 100,
    superWordBonus: Math.round(superWordBonus * 100) / 100,
    enduranceBonus: Math.round(enduranceBonus * 100) / 100,
    total: Math.round(total * 100) / 100,
    details,
  };
}

/**
 * Multiplayer coin reward on match end.
 */
export function calculateMultiplayerBonus(
  result: 'win' | 'draw' | 'loss',
  opponentForfeited: boolean,
  movesPlayed: number,
): { coins: number; label: string } {
  if (result === 'loss' && !opponentForfeited) {
    return { coins: 0.5, label: 'Förlust: +0.5 🪙' };
  }

  if (opponentForfeited) {
    // Scaled: min(moves/30, 1) × 1
    const scaled = Math.min(movesPlayed / 30, 1) * 1;
    const coins = Math.round(scaled * 100) / 100;
    return { coins, label: `Motståndaren gav upp: +${coins.toFixed(2)} 🪙` };
  }

  if (result === 'draw') {
    return { coins: 1.5, label: 'Oavgjort: +1.5 🪙' };
  }

  // Win
  return { coins: 3, label: 'Vinst: +3 🪙' };
}
