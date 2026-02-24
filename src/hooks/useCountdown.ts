import { useState, useEffect } from 'react';

/**
 * Countdown hook for flash sales.
 * Returns time remaining and whether the sale is still active.
 */
export function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(endDate));

  useEffect(() => {
    if (!endDate) return;
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

function calcTimeLeft(endDate: string | null | undefined) {
  if (!endDate) return { active: false, days: 0, hours: 0, minutes: 0, seconds: 0, label: '' };
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { active: false, days: 0, hours: 0, minutes: 0, seconds: 0, label: '' };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}j`);
  parts.push(`${String(hours).padStart(2, '0')}h`);
  parts.push(`${String(minutes).padStart(2, '0')}m`);
  parts.push(`${String(seconds).padStart(2, '0')}s`);

  return { active: true, days, hours, minutes, seconds, label: parts.join(' ') };
}
