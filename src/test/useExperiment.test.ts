import { describe, it, expect } from 'vitest';

// Test the pure hash + variant logic (no React needed)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant<T extends string>(experimentId: string, variants: T[], userId: string): T {
  const hash = simpleHash(`${experimentId}:${userId}`);
  return variants[hash % variants.length];
}

describe('A/B testing - pickVariant', () => {
  it('returns consistent variant for same user + experiment', () => {
    const v1 = pickVariant('test-exp', ['a', 'b'], 'user-1');
    const v2 = pickVariant('test-exp', ['a', 'b'], 'user-1');
    expect(v1).toBe(v2);
  });

  it('returns only valid variants', () => {
    const variants = ['control', 'variant_a', 'variant_b'] as const;
    for (let i = 0; i < 100; i++) {
      const v = pickVariant('exp', [...variants], `user-${i}`);
      expect(variants).toContain(v);
    }
  });

  it('different experiments can yield different variants for same user', () => {
    // This tests distribution - not guaranteed but very likely over many tries
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(pickVariant(`exp-${i}`, ['a', 'b'], 'user-fixed'));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
