import { useState, useCallback, useEffect } from 'react';

const COINS_KEY = 'wr-coins';

export function useCoins() {
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(COINS_KEY);
      return saved ? Number(JSON.parse(saved)) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem(COINS_KEY, JSON.stringify(coins));
  }, [coins]);

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => prev + amount);
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setCoins((prev) => {
      if (prev >= amount) {
        success = true;
        return prev - amount;
      }
      return prev;
    });
    return success;
  }, []);

  return { coins, addCoins, spendCoins };
}
