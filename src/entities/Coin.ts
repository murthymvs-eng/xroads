import * as THREE from 'three';
import { Entity } from './Entity';
import { TILE, GRID, COIN } from '../data/tuning';
import { hash01 } from '../core/RNG';
import { MeshFactory } from '../render/MeshFactory';

// A single collectible coin sitting on a lane cell. Static (doesn't move).
// Collected when the player's col matches the coin's col on the same row.
export class Coin extends Entity {
  readonly mesh: THREE.Object3D;
  collected = false;

  constructor(row: number, col: number, mesh: THREE.Object3D) {
    super();
    this.row = row;
    this.col = col;
    this.mesh = mesh;
    mesh.position.set(col * TILE, 0.35, -row * TILE);
  }

  // Whether this coin is at the given cell.
  at(col: number, row: number): boolean {
    return this.col === col && this.row === row && !this.collected;
  }

  // Mark as collected and hide the mesh.
  collect(): void {
    this.collected = true;
    this.mesh.visible = false;
  }
}

// Build a coin mesh (golden cylinder).
export function makeCoinMesh(factory: MeshFactory): THREE.Object3D {
  return factory.makeCoin();
}

// Deterministic coin placement: coins spawn on eligible rows (all lane types),
// at random columns. Coins don't move and are collected by stepping on them.
class CoinLane {
  coins: Coin[] = [];
  constructor(
    readonly row: number,
    private scene: THREE.Scene,
    private factory: MeshFactory,
    seed: number,
  ) {
    const count =
      COIN.minPerRow +
      Math.floor(hash01(seed, row * 31 + 1) * (COIN.maxPerRow - COIN.minPerRow + 1));
    for (let i = 0; i < count; i++) {
      const col = GRID.colMin +
        Math.floor(hash01(seed, row * 31 + 2 + i) * (GRID.colMax - GRID.colMin + 1));
      const mesh = makeCoinMesh(factory);
      const c = new Coin(row, col, mesh);
      this.scene.add(mesh);
      this.coins.push(c);
    }
  }

  dispose(): void {
    for (const c of this.coins) this.scene.remove(c.mesh);
    this.coins.length = 0;
  }
}

// Manages coins for the visible band of rows around the player.
export class CoinSystem {
  private lanes = new Map<number, CoinLane>();
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
      if (hash01(this.seed, r * 31) < COIN.chance && !this.lanes.has(r)) {
        this.lanes.set(r, new CoinLane(r, this.scene, this.factory, this.seed));
      }
    }
    for (const [row, lane] of this.lanes) {
      if (row < minR || row > maxR + 4) {
        lane.dispose();
        this.lanes.delete(row);
      }
    }
  }

  // Check if the player is on a coin cell; collect it and return its value.
  collectAt(col: number, row: number): number {
    for (const lane of this.lanes.values()) {
      if (lane.row !== row) continue;
      for (const c of lane.coins) {
        if (!c.collected && c.at(col, row)) {
          c.collect();
          return COIN.value;
        }
      }
    }
    return 0;
  }

  reset(): void {
    for (const lane of this.lanes.values()) lane.dispose();
    this.lanes.clear();
  }
}

