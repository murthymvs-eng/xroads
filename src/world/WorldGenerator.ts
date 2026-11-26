import { hash01, weightedPick } from '../core/RNG';
import { Lane } from './Lane';
import { ROW_WEIGHTS, type LaneType } from '../data/laneConfig';

// Assigns a lane type to each row as a pure function of (seed, row).
// Memoized so a run is reproducible and chunk rebuilds are safe/cheap.
export class WorldGenerator {
  private cache = new Map<number, LaneType>();
  public seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  reset(seed: number): void {
    this.seed = seed;
    this.cache.clear();
  }

  typeOfRow(row: number): LaneType {
    const hit = this.cache.get(row);
    if (hit) return hit;

    let t = weightedPick(hash01(this.seed, row), ROW_WEIGHTS);
    // Avoid stacking the same "hard" type on adjacent rows (keeps runs readable).
    const prev = row > 0 ? this.typeOfRow(row - 1) : 'grass';
    if ((t === 'river' || t === 'rail') && t === prev) t = 'grass';

    this.cache.set(row, t);
    return t;
  }

  makeRow(row: number): Lane {
    return new Lane(row, this.typeOfRow(row));
  }
}