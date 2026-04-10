import { useCallback, useRef, useEffect } from 'react';
import { BubbleData } from '@/data/gameConstants';

type GameMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

export interface AIRoundResult {
  score: number;
  words: { word: string; score: number }[];
  movesUsed: number;
  bestWord: string | null;
  bestWordScore: number;
  finalGrid: BubbleData[][];
  usedWordsList: string[];
}

export function useAIOpponent() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const runAIRound = useCallback((
    grid: BubbleData[][],
    isValidWord: (w: string) => boolean,
    mode: GameMode,
    maxMoves: number,
    sharedUsedWords: string[] = [],
    validWordsList?: string[],
  ): Promise<AIRoundResult> => {
    return new Promise((resolve, reject) => {
      // Terminate previous worker if any
      workerRef.current?.terminate();

      const worker = new Worker(
        new URL('../workers/aiWorker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<AIRoundResult>) => {
        resolve(e.data);
      };

      worker.onerror = (err) => {
        console.error('AI Worker error:', err);
        reject(err);
      };

      // We need the word list as an array to send to the worker.
      // If not provided, we can't run in worker — fallback not needed
      // since the caller should always provide it.
      worker.postMessage({
        grid,
        validWordsList: validWordsList ?? [],
        mode,
        totalMoves: maxMoves,
        sharedUsedWords,
        difficulty: 'medium',
      });
    });
  }, []);

  return { runAIRound };
}
