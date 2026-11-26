import * as THREE from 'three';
import { Entity } from './Entity';
import { TILE, GRID, WATER, LOG_COLORS, TURTLE_COLORS } from '../data/tuning';
import { hash01 } from '../core/RNG';
import { MeshFactory } from '../render/MeshFactory';

export type FloatKind = 'log' | 'turtle';

// A floating object on a river lane. Moves continuously along the lane (x),
// wraps around the track, and can be ridden by the player. `width` is how many
// grid cells it spans (1-3); the player is supported if their col falls within
// the object's span.
export class FloatingObject extends Entity {
  readonly mesh: THREE.Group;
  x: number; // continuous world x
  speed: number; // tiles/sec
  dir: 1 | -1;
  kind: FloatKind;
  width: number; // cells spanned
  private trackMin: number;
  private trackMax: number;

  constructor(row: number, x: number, dir: 1 | -1, speed: number, kind: FloatKind, width: number, mesh: THREE.Group) {
    super();
    this.row = row;
    this.x = x;
    this.dir = dir;
    this.speed = speed;
    this.kind = kind;
    this.width = width;
    this.mesh = mesh;
    this.trackMin = (GRID.colMin - 1) * TILE;
    this.trackMax = (GRID.colMax + 1) * TILE;
    this.col = Math.round(x / TILE);
    mesh.position.set(x, TILE / 2, -row * TILE);
  }

  // Grid cells (inclusive) this object covers, based on its current x.
  get colMin(): number {
    const center = Math.round(this.x / TILE);
    const half = Math.floor(this.width / 2);
    return center - half;
  }
  get colMax(): number {
    const center = Math.round(this.x / TILE);
    const half = Math.floor(this.width / 2);
    return center + half;
  }

  // Whether the given grid col is supported by this object.
  supports(col: number): boolean {
    return col >= this.colMin && col <= this.colMax;
  }

  update(dt: number): void {
    const span = this.trackMax - this.trackMin;
    this.x += this.dir * this.speed * TILE * dt;
    let nx = this.x - this.trackMin;
    nx = ((nx % span) + span) % span;
    this.x = nx + this.trackMin;
    this.col = Math.round(this.x / TILE);
    this.mesh.position.x = this.x;
  }
}

// Builds a log or turtle mesh with a little visual detail.
export function makeFloatingObject(kind: FloatKind, color: number, width: number, factory: MeshFactory): THREE.Group {
  return factory.makeFloat(kind, color, width);
}

// Deterministic river lane: a set of floating objects of a given kind/speed,
// evenly spread across the track, all moving in one direction.
class RiverLane {
  objs: FloatingObject[] = [];
  constructor(
    readonly row: number,
    private scene: THREE.Scene,
    private factory: MeshFactory,
    seed: number,
  ) {
    const dir: 1 | -1 = hash01(seed, row * 11 + 1) < 0.5 ? -1 : 1;
    const speed =
      WATER.minSpeed + (hash01(seed, row * 11 + 2) - 0.5) * (WATER.maxSpeed - WATER.minSpeed);
    const count =
      WATER.minObjs +
      Math.floor(hash01(seed, row * 11 + 3) * (WATER.maxObjs - WATER.minObjs + 1));
    const trackCols = GRID.colMax - GRID.colMin + 2;
    const startX = GRID.colMin - 1;
    for (let i = 0; i < count; i++) {
      const xCol = startX + (count > 1 ? (i / count) * trackCols : 0);
      const x = xCol * TILE;
      const isTurtle = hash01(seed, row * 11 + i) < 0.35;
      const kind: FloatKind = isTurtle ? 'turtle' : 'log';
      const width =
        WATER.minWidth +
        Math.floor(hash01(seed, row * 17 + i) * (WATER.maxWidth - WATER.minWidth + 1));
      const colors = isTurtle ? TURTLE_COLORS : LOG_COLORS;
      const color = colors[Math.floor(hash01(seed, row * 23 + i) * colors.length)] ?? 0x8b5a2b;
      const mesh = makeFloatingObject(kind, color, width, factory);
      const o = new FloatingObject(row, x, dir, speed, kind, width, mesh);
      this.scene.add(mesh);
      this.objs.push(o);
    }
  }

  update(dt: number): void {
    for (const o of this.objs) o.update(dt);
  }

  dispose(): void {
    for (const o of this.objs) this.scene.remove(o.mesh);
    this.objs.length = 0;
  }
}

// Manages floating objects (logs/turtles) for the visible band of river rows.
export class Water {
  private rivers = new Map<number, RiverLane>();
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
      if (gen.typeOfRow(r) === 'river' && !this.rivers.has(r)) {
        this.rivers.set(r, new RiverLane(r, this.scene, this.factory, this.seed));
      }
    }
    for (const [row, river] of this.rivers) {
      if (row < minR || row > maxR + 4) {
        river.dispose();
        this.rivers.delete(row);
      }
    }
  }

  update(dt: number): void {
    for (const river of this.rivers.values()) river.update(dt);
  }

  // Re-evaluate what the player is riding based on current positions. Call after
  // water.update() and movement.update() each frame.
  updateRiding(player: { row: number; col: number; world: { x: number }; isMoving: boolean; riding: any; rideX: number }): void {
    if (player.isMoving) return; // don't change riding mid-step
    const objs = this.objsInRow(player.row);
    const onObj = objs.find((o) => o.supports(player.col));
    if (onObj) {
      if (player.riding !== onObj) {
        player.riding = onObj;
        player.rideX = player.world.x - onObj.x;
      }
    } else {
      player.riding = null;
      player.rideX = 0;
    }
  }

  // True if the player is on a river row with no supporting object beneath them.
  checkDrown(player: { row: number; col: number; isMoving: boolean; riding: any }, gen: { typeOfRow(row: number): string }): boolean {
    if (gen.typeOfRow(player.row) !== 'river') return false;
    if (player.isMoving) return false; // don't drown mid-step
    if (player.riding) return false; // riding an object
    const objs = this.objsInRow(player.row);
    return !objs.some((o) => o.supports(player.col));
  }

  objsInRow(row: number): FloatingObject[] {
    const river = this.rivers.get(row);
    return river ? river.objs : [];
  }

  reset(): void {
    for (const river of this.rivers.values()) river.dispose();
    this.rivers.clear();
  }
}
