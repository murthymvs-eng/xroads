import { TILE } from '../data/tuning';

// Pure integer lattice. North = +row = -Z. Kept framework-agnostic (no three).
export class Grid {
  constructor(
    readonly colMin: number = -7,
    readonly colMax: number = 7,
  ) {}

  inBounds(col: number, row: number): boolean {
    return col >= this.colMin && col <= this.colMax;
  }

  // World coordinates for a grid cell (y supplied separately by the caller).
  toWorld(col: number, row: number, y = 0): { x: number; y: number; z: number } {
    return { x: col * TILE, y, z: -row * TILE };
  }
}
