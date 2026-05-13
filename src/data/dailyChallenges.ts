import type { GameMode } from '@/pages/GamePage';

export type DailyMetric = 'score' | 'words' | 'bestWord';

export interface DailyChallenge {
  id: string;
  mode: GameMode;
  /** For bomb mode "survive" challenges — moves to survive to count as a win. */
  surviveMoves?: number;
  metric: DailyMetric;
  /** [oneStar, twoStars, threeStars]. To earn N stars, the metric must be >= thresholds[N-1]. */
  starThresholds: [number, number, number];
  titleSv: string;
  titleEn: string;
  goalSv: string;
  goalEn: string;
}

/**
 * Pool of daily challenges. The first entry is what every brand-new day starts on
 * (today maps to index 0). After that the pool rotates by epoch day.
 */
export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'bomb-survive-100',
    mode: 'bomb',
    surviveMoves: 100,
    metric: 'score',
    starThresholds: [0, 150, 200],
    titleSv: 'Bomb-överlevnad',
    titleEn: 'Bomb Survival',
    goalSv: 'Överlev 100 drag i Bomb Mode utan att en bomb sprängs.',
    goalEn: 'Survive 100 moves in Bomb Mode without any bomb exploding.',
  },
  {
    id: 'classic-score-300',
    mode: 'classic',
    metric: 'score',
    starThresholds: [200, 300, 400],
    titleSv: 'Klassisk poängjakt',
    titleEn: 'Classic Score Hunt',
    goalSv: 'Få så många poäng som möjligt på 50 drag i Classic.',
    goalEn: 'Score as much as possible in 50 moves of Classic.',
  },
  {
    id: 'surge-words-25',
    mode: 'surge',
    metric: 'words',
    starThresholds: [20, 30, 40],
    titleSv: 'Ord-surge',
    titleEn: 'Word Surge Sprint',
    goalSv: 'Hitta så många ord du kan i Word Surge.',
    goalEn: 'Find as many words as possible in Word Surge.',
  },
  {
    id: 'oneword-best-70',
    mode: 'oneword',
    metric: 'bestWord',
    starThresholds: [50, 70, 100],
    titleSv: 'Ett mäktigt ord',
    titleEn: 'One Mighty Word',
    goalSv: 'Hitta ett enda långt ord med så hög poäng som möjligt.',
    goalEn: 'Find a single long word with the highest score possible.',
  },
  {
    id: 'fiveplus-score-200',
    mode: 'fiveplus',
    metric: 'score',
    starThresholds: [120, 200, 300],
    titleSv: '5+ utmaning',
    titleEn: '5+ Challenge',
    goalSv: 'Samla poäng med ord på minst 5 bokstäver.',
    goalEn: 'Score points using only 5+ letter words.',
  },
  {
    id: 'classic-words-20',
    mode: 'classic',
    metric: 'words',
    starThresholds: [15, 22, 30],
    titleSv: 'Ordsamlare',
    titleEn: 'Word Collector',
    goalSv: 'Hitta så många ord du kan på 50 drag.',
    goalEn: 'Find as many words as you can in 50 moves.',
  },
  {
    id: 'bomb-survive-75',
    mode: 'bomb',
    surviveMoves: 75,
    metric: 'score',
    starThresholds: [0, 100, 175],
    titleSv: 'Liten bombträning',
    titleEn: 'Bomb Drill',
    goalSv: 'Överlev 75 drag i Bomb Mode.',
    goalEn: 'Survive 75 moves in Bomb Mode.',
  },
];

/** Coins awarded per star count. */
export const STAR_REWARDS: Record<0 | 1 | 2 | 3, number> = { 0: 0, 1: 10, 2: 30, 3: 50 };

/** Today as a stable YYYY-MM-DD key in local time. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Days since a baseline (today on the day this feature shipped). */
const BASELINE = todayKey();
function daysSinceBaseline(key: string): number {
  const a = new Date(BASELINE + 'T00:00:00').getTime();
  const b = new Date(key + 'T00:00:00').getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function getChallengeForDate(d: Date = new Date()): DailyChallenge {
  const key = todayKey(d);
  const idx = daysSinceBaseline(key) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}

export function computeStars(c: DailyChallenge, metricValue: number, survived: boolean): 0 | 1 | 2 | 3 {
  // Survive challenges require survival to earn any star.
  if (c.surviveMoves && !survived) return 0;
  if (metricValue >= c.starThresholds[2]) return 3;
  if (metricValue >= c.starThresholds[1]) return 2;
  if (metricValue >= c.starThresholds[0]) return 1;
  return 0;
}
