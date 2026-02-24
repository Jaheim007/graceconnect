import { describe, it, expect } from 'vitest';
import { getLevel } from '@/hooks/useGamificationEngine';

describe('getLevel', () => {
  it('returns level 1 for 0 points', () => {
    const lvl = getLevel(0);
    expect(lvl.level).toBe(1);
    expect(lvl.progress).toBe(0);
  });

  it('returns level 2 at 50 points', () => {
    const lvl = getLevel(50);
    expect(lvl.level).toBe(2);
    expect(lvl.progress).toBe(0);
  });

  it('calculates mid-level progress correctly', () => {
    // Level 2: 50-149, so 100 points = 50/100 = 50%
    const lvl = getLevel(100);
    expect(lvl.level).toBe(2);
    expect(lvl.progress).toBe(50);
  });

  it('returns level 10 and 100% at max points', () => {
    const lvl = getLevel(25000);
    expect(lvl.level).toBe(10);
    expect(lvl.progress).toBe(100);
  });

  it('handles very large points', () => {
    const lvl = getLevel(999999);
    expect(lvl.level).toBe(10);
    expect(lvl.progress).toBe(100);
  });

  it('returns correct nextMin for each level', () => {
    const l1 = getLevel(0);
    expect(l1.nextMin).toBe(50);

    const l5 = getLevel(500);
    expect(l5.nextMin).toBe(1000);
  });
});
