import { useCallback, useEffect, useState } from 'react';
import { todayKey, getChallengeForDate, type DailyChallenge } from '@/data/dailyChallenges';

const COMPLETED_PREFIX = 'wr-daily-completed:';
const POPUP_SHOWN_PREFIX = 'wr-daily-popup-shown:';

export function useDailyChallenge() {
  const [today, setToday] = useState(todayKey());
  const challenge: DailyChallenge = getChallengeForDate();

  // Refresh "today" once per minute in case the user keeps the app open across midnight.
  useEffect(() => {
    const id = setInterval(() => {
      const k = todayKey();
      setToday(prev => (prev === k ? prev : k));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const completedKey = COMPLETED_PREFIX + today;
  const popupKey = POPUP_SHOWN_PREFIX + today;

  const stars = (() => {
    try {
      const v = localStorage.getItem(completedKey);
      return v ? Math.max(0, Math.min(3, parseInt(v, 10) || 0)) : 0;
    } catch { return 0; }
  })();

  const isCompleted = stars > 0;

  const markCompleted = useCallback((earned: 1 | 2 | 3) => {
    try {
      const prev = parseInt(localStorage.getItem(completedKey) || '0', 10) || 0;
      if (earned > prev) localStorage.setItem(completedKey, String(earned));
    } catch { /* ignore */ }
  }, [completedKey]);

  const shouldShowPopup = (() => {
    if (isCompleted) return false;
    try { return !localStorage.getItem(popupKey); } catch { return false; }
  })();

  const markPopupShown = useCallback(() => {
    try { localStorage.setItem(popupKey, '1'); } catch { /* ignore */ }
  }, [popupKey]);

  return { challenge, today, isCompleted, stars, markCompleted, shouldShowPopup, markPopupShown };
}
