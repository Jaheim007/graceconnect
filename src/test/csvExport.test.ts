import { describe, it, expect, vi } from 'vitest';

// We test the CSV row generation logic by extracting it
describe('CSV generation logic', () => {
  function generateCSVRows(data: Record<string, unknown>[]): string[] {
    if (!data.length) return [];
    const headers = Object.keys(data[0]);
    return [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      ),
    ];
  }

  it('generates correct headers', () => {
    const rows = generateCSVRows([{ name: 'Alice', age: 30 }]);
    expect(rows[0]).toBe('name,age');
  });

  it('generates correct data row', () => {
    const rows = generateCSVRows([{ name: 'Bob', age: 25 }]);
    expect(rows[1]).toBe('Bob,25');
  });

  it('escapes commas in values', () => {
    const rows = generateCSVRows([{ note: 'hello, world' }]);
    expect(rows[1]).toBe('"hello, world"');
  });

  it('escapes double quotes', () => {
    const rows = generateCSVRows([{ note: 'say "hi"' }]);
    expect(rows[1]).toBe('"say ""hi"""');
  });

  it('handles null and undefined', () => {
    const rows = generateCSVRows([{ a: null, b: undefined }]);
    expect(rows[1]).toBe(',');
  });

  it('returns empty for empty array', () => {
    expect(generateCSVRows([])).toEqual([]);
  });
});
