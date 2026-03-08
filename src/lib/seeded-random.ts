/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Ensures the same seed always produces the same sequence,
 * but different seeds (e.g., different days/hours) produce unique output.
 */
export function createSeededRandom(seed: number) {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a seed from a string (e.g., date + session) */
export function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

/** Pick from array using seeded random */
export function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Seeded random int in range */
export function seededInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Get a day-based seed that changes daily */
export function getDaySeed(): number {
  const d = new Date();
  return hashString(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
}

/** Get an hour-based seed that changes hourly */
export function getHourSeed(): number {
  const d = new Date();
  return hashString(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`);
}
