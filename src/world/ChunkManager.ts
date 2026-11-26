import * as THREE from 'three';
import { Lane } from './Lane';
import { WorldGenerator } from './WorldGenerator';
import { Grid } from './Grid';
import { MeshFactory } from '../render/MeshFactory';
import { VISIBLE } from '../data/tuning';

// Materializes ground tiles for the visible row band around the player and
// garbage-collects tiles that scroll far out of view. Lane types come from the
// (deterministic) generator, so rows rebuild identically.
export class ChunkManager {
  private tiles = new Map<string, THREE.Mesh>();
  private lanes = new Map<number, Lane>();

  constructor(
    private scene: THREE.Scene,
    private generator: WorldGenerator,
    private grid: Grid,
    private mesh: MeshFactory,
  ) {}

  private lane(row: number): Lane {
    let l = this.lanes.get(row);
    if (!l) {
      l = this.generator.makeRow(row);
      this.lanes.set(row, l);
    }
    return l;
  }

  private key(c: number, r: number): string {
    return c + ',' + r;
  }

  sync(playerRow: number): void {
    const minR = playerRow - VISIBLE.behind;
    const maxR = playerRow + VISIBLE.ahead;

    for (let r = minR; r <= maxR; r++) {
      const lane = this.lane(r);
      for (let c = this.grid.colMin; c <= this.grid.colMax; c++) {
        const k = this.key(c, r);
        if (!this.tiles.has(k)) {
          const m = this.mesh.makeTile(lane.type, c, r);
          this.tiles.set(k, m);
          this.scene.add(m);
        }
      }
    }

    for (const [k, m] of this.tiles) {
      const r = Number(k.split(',')[1]);
      if (r < minR || r > maxR + 4) {
        this.scene.remove(m);
        this.tiles.delete(k);
      }
    }
  }

  // Tear down all ground so a fresh run can be generated.
  reset(): void {
    for (const m of this.tiles.values()) this.scene.remove(m);
    this.tiles.clear();
    this.lanes.clear();
  }
}