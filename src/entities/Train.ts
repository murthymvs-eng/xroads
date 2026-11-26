import * as THREE from 'three';
import { Entity } from './Entity';
import { TILE, GRID, RAIL, TRAIN_COLORS, TELEGRAPH_COLOR } from '../data/tuning';
import { hash01 } from '../core/RNG';
import { MeshFactory } from '../render/MeshFactory';

// A multi-segment train convoy on a rail lane. Moves as one unit, wrapping the
// track. The engine is at the front; cars trail behind. Kills the player if
// their col falls within the train's occupied cell range.
export class Train extends Entity {
  readonly meshes: THREE.Group[]; // one mesh per segment
  x: number; // engine position (front of train)
  speed: number; // tiles/sec
  dir: 1 | -1;
  length: number; // segment count
  private trackMin: number;
  private trackMax: number;

  constructor(row: number, x: number, dir: 1 | -1, speed: number, length: number, meshes: THREE.Group[]) {
    super();
    this.row = row;
    this.x = x;
    this.dir = dir;
    this.speed = speed;
    this.length = length;
    this.meshes = meshes;
    this.trackMin = (GRID.colMin - 1) * TILE;
    this.trackMax = (GRID.colMax + 1) * TILE;
    this.col = Math.round(x / TILE);
    this.placeMeshes();
  }

  // Cells occupied by the train (inclusive). Engine is at `col`; cars trail.
  get colMin(): number {
    const center = Math.round(this.x / TILE);
    return this.dir === 1 ? center : center - this.length + 1;
  }
  get colMax(): number {
    const center = Math.round(this.x / TILE);
    return this.dir === 1 ? center + this.length - 1 : center;
  }

  // Whether the given grid col is within this train's span.
  occupies(col: number): boolean {
    return col >= this.colMin && col <= this.colMax;
  }

  private placeMeshes(): void {
    for (let i = 0; i < this.meshes.length; i++) {
      const segX = this.x - i * TILE * 0.92 * this.dir;
      this.meshes[i].position.set(segX, TILE / 2, -this.row * TILE);
    }
  }

  update(dt: number): void {
    const span = this.trackMax - this.trackMin;
    this.x += this.dir * this.speed * TILE * dt;
    let nx = this.x - this.trackMin;
    nx = ((nx % span) + span) % span;
    this.x = nx + this.trackMin;
    this.col = Math.round(this.x / TILE);
    this.placeMeshes();
  }
}

// A single train segment mesh (engine or car).
export function makeTrainSegment(color: number, isEngine: boolean, factory: MeshFactory): THREE.Group {
  return factory.makeTrain(color, isEngine);
}

// Deterministic rail lane: a set of trains of a given length/speed,
// evenly spread across the track, all moving in one direction. Telegraph
// poles are static decoration along the lane.
class RailLane {
  trains: Train[] = [];
  poles: THREE.Object3D[] = [];
  constructor(
    readonly row: number,
    private scene: THREE.Scene,
    private factory: MeshFactory,
    seed: number,
  ) {
    const dir: 1 | -1 = hash01(seed, row * 17 + 1) < 0.5 ? -1 : 1;
    const speed =
      RAIL.minSpeed + (hash01(seed, row * 17 + 2) - 0.5) * (RAIL.maxSpeed - RAIL.minSpeed);
    const length =
      RAIL.minLength + Math.floor(hash01(seed, row * 17 + 3) * (RAIL.maxLength - RAIL.minLength + 1));
    const count =
      RAIL.minTrains + Math.floor(hash01(seed, row * 17 + 4) * (RAIL.maxTrains - RAIL.minTrains + 1));
    const trackCols = GRID.colMax - GRID.colMin + 2;
    const startX = GRID.colMin - 1;

    // Telegraph poles: static vertical posts spaced along the track.
    for (let c = GRID.colMin - 1; c <= GRID.colMax + 1; c += 2) {
      const pole = this.factory.makeTelegraphPole();
      pole.position.set(c * TILE, 0.5, -row * TILE);
      this.scene.add(pole);
      this.poles.push(pole);
    }

    for (let i = 0; i < count; i++) {
      const xCol = startX + (count > 1 ? (i / count) * trackCols : 0);
      const x = xCol * TILE;
      const color = TRAIN_COLORS[Math.floor(hash01(seed, row * 29 + i) * TRAIN_COLORS.length)] ?? 0x2b2f33;
      const meshes: THREE.Group[] = [];
      for (let s = 0; s < length; s++) {
        meshes.push(makeTrainSegment(color, s === 0, factory));
      }
      const t = new Train(row, x, dir, speed, length, meshes);
      meshes.forEach((m) => this.scene.add(m));
      this.trains.push(t);
    }
  }

  update(dt: number): void {
    for (const t of this.trains) t.update(dt);
  }

  dispose(): void {
    for (const t of this.trains) t.meshes.forEach((m) => this.scene.remove(m));
    for (const p of this.poles) this.scene.remove(p);
    this.trains.length = 0;
    this.poles.length = 0;
  }
}

// Manages railroad traffic for the visible band of rail rows around the player.
export class Rail {
  private rails = new Map<number, RailLane>();
  private seed = 0;

  constructor(
    private scene: THREE.Scene,
    private factory: MeshFactory,
  ) {}

  setSeed(seed: number): void {
    this.seed = seed;
  }

  sync(playerRow: number, gen: { typeOfRow(row: number): string }): void {
    const minR = playerRow - 8;
    const maxR = playerRow + 24;
    for (let r = minR; r <= maxR; r++) {
      if (gen.typeOfRow(r) === 'rail' && !this.rails.has(r)) {
        this.rails.set(r, new RailLane(r, this.scene, this.factory, this.seed));
      }
    }
    for (const [row, rail] of this.rails) {
      if (row < minR || row > maxR + 4) {
        rail.dispose();
        this.rails.delete(row);
      }
    }
  }

  update(dt: number): void {
    for (const rail of this.rails.values()) rail.update(dt);
  }

  // Trains currently in the given rail row (for collision).
  trainsInRow(row: number): Train[] {
    const rail = this.rails.get(row);
    return rail ? rail.trains : [];
  }

  reset(): void {
    for (const rail of this.rails.values()) rail.dispose();
    this.rails.clear();
  }
}
