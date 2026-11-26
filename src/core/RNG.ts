// Deterministic PRNG + pure hash helpers.
// hash01 lets world features (lane types, traffic) be a stable pure function of
// (seed, key), so chunks can be rebuilt/torn down freely and a run is reproducible.
export function hash01(seed: number, key: number): number {
  let h = (seed ^ Math.imul(key + 0x9e3779b9, 0x85ebca6b)) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 13), 0x297a1d37);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Pick a key from a weight table using a pre-generated random value v in [0,1).
export function weightedPick<T extends string>(v: number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  let total = 0;
  for (const [, w] of entries) total += w;
  let r = v * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r < 0) return k;
  }
  return entries[0][0];
}

// Small streaming PRNG (mulberry32) for transient randomness.
export class RNG {
  private s: number;
  constructor(seed: number = (Math.random() * 0xffffffff) >>> 0) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  weighted<T extends string>(weights: Record<T, number>): T {
    return weightedPick(this.next(), weights);
  }
}