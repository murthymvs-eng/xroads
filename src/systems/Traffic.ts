import * as THREE from 'three';
import { Vehicle } from '../entities/Vehicle';
import { MeshFactory } from '../render/MeshFactory';
import { WorldGenerator } from '../world/WorldGenerator';
import { GRID, TRAFFIC, CAR_COLORS, VISIBLE, TILE } from '../data/tuning';
import { hash01 } from '../core/RNG';

const EMPTY: Vehicle[] = [];

// A road row's traffic: a fixed set of cars evenly spread across the track,
// all moving in one direction at one speed. Deterministic per (seed, row).
class RoadLane {
  cars: Vehicle[] = [];
  constructor(
    readonly row: number,
    private scene: THREE.Scene,
    private factory: MeshFactory,
    seed: number,
  ) {
    const dir: 1 | -1 = hash01(seed, row * 7 + 1) < 0.5 ? -1 : 1;
    const speed =
      TRAFFIC.minSpeed + (hash01(seed, row * 7 + 2) - 0.5) * (TRAFFIC.maxSpeed - TRAFFIC.minSpeed);
    const count =
      TRAFFIC.minCars +
      Math.floor(hash01(seed, row * 7 + 3) * (TRAFFIC.maxCars - TRAFFIC.minCars + 1));
    const trackCols = GRID.colMax - GRID.colMin + 2;
    const startX = GRID.colMin - 1;
    for (let i = 0; i < count; i++) {
      const xCol = startX + (count > 1 ? (i / count) * trackCols : 0);
      const x = xCol * TILE;
      const colorIdx = Math.floor(hash01(seed, row * 13 + i) * CAR_COLORS.length);
      const color = CAR_COLORS[colorIdx] ?? 0xd9534f;
      const mesh = this.factory.makeCar(color);
      const v = new Vehicle(row, x, dir, speed, mesh);
      this.scene.add(mesh);
      this.cars.push(v);
    }
  }

  update(dt: number): void {
    for (const c of this.cars) c.update(dt);
  }

  dispose(): void {
    for (const c of this.cars) this.scene.remove(c.mesh);
    this.cars.length = 0;
  }
}

// Manages road traffic for the visible band of road rows around the player.
export class Traffic {
  private roads = new Map<number, RoadLane>();
  private seed = 0;

  constructor(
    private scene: THREE.Scene,
    private factory: MeshFactory,
  ) {}

  setSeed(seed: number): void {
    this.seed = seed;
  }

  sync(playerRow: number, gen: WorldGenerator): void {
    const minR = playerRow - VISIBLE.behind;
    const maxR = playerRow + VISIBLE.ahead;
    for (let r = minR; r <= maxR; r++) {
      if (gen.typeOfRow(r) === 'road' && !this.roads.has(r)) {
        this.roads.set(r, new RoadLane(r, this.scene, this.factory, this.seed));
      }
    }
    for (const [row, road] of this.roads) {
      if (row < minR || row > maxR + 4) {
        road.dispose();
        this.roads.delete(row);
      }
    }
  }

  update(dt: number): void {
    for (const road of this.roads.values()) road.update(dt);
  }

  // Vehicles currently in the given row (for collision).
  carsInRow(row: number): Vehicle[] {
    const road = this.roads.get(row);
    return road ? road.cars : EMPTY;
  }

  reset(): void {
    for (const road of this.roads.values()) road.dispose();
    this.roads.clear();
  }
}