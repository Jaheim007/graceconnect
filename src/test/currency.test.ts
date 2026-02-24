import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPrice, getCurrencyInfo, DEFAULT_CURRENCY } from '@/lib/currency';

describe('formatCurrency', () => {
  it('formats XOF by default', () => {
    const result = formatCurrency(5000);
    expect(result).toContain('5');
    expect(result.toLowerCase()).toMatch(/cfa|xof/i);
  });

  it('formats USD correctly', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('100');
  });

  it('formats EUR correctly', () => {
    const result = formatCurrency(250, 'EUR');
    expect(result).toContain('250');
  });

  it('handles null currency gracefully', () => {
    const result = formatCurrency(1000, null);
    expect(result).toBeTruthy();
  });

  it('falls back for unknown currency code', () => {
    const result = formatCurrency(500, 'ZZZZZ');
    expect(result).toContain('500');
  });
});

describe('formatPrice', () => {
  it('returns free label when isFree is true', () => {
    expect(formatPrice(0, true)).toBe('Gratuit');
  });

  it('returns free label when amount is 0', () => {
    expect(formatPrice(0, false)).toBe('Gratuit');
  });

  it('returns formatted price for non-free', () => {
    const result = formatPrice(2500, false, 'XOF');
    expect(result).toContain('2');
  });

  it('uses custom free label', () => {
    expect(formatPrice(0, true, null, undefined, 'Free')).toBe('Free');
  });
});

describe('getCurrencyInfo', () => {
  it('finds XOF info', () => {
    const info = getCurrencyInfo('XOF');
    expect(info).toBeDefined();
    expect(info?.symbol).toBe('FCFA');
  });

  it('returns undefined for unknown', () => {
    expect(getCurrencyInfo('ZZZ')).toBeUndefined();
  });
});

describe('DEFAULT_CURRENCY', () => {
  it('is XOF', () => {
    expect(DEFAULT_CURRENCY).toBe('XOF');
  });
});
