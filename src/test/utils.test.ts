import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className merge)', () => {
  it('merges simple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('merges tailwind conflicts correctly', () => {
    const result = cn('px-4', 'px-2');
    expect(result).toBe('px-2');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('returns empty for no args', () => {
    expect(cn()).toBe('');
  });
});
