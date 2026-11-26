import * as THREE from 'three';
import { Entity } from './Entity';
import { TILE, GRID } from '../data/tuning';

// A single-cell road mover. Moves continuously along the lane (x), wrapping
// around the track so traffic flows endlessly. Collision is grid-based on `col`.
export class Vehicle extends Entity {
  readonly mesh: THREE.Group;
  x: number; // continuous world x
  speed: number; // tiles/sec
  dir: 1 | -1;
  private trackMin: number;
  private trackMax: number;

  constructor(row: number, x: number, dir: 1 | -1, speed: number, mesh: THREE.Group) {
    super();
    this.row = row;
    this.x = x;
    this.dir = dir;
    this.speed = speed;
    this.mesh = mesh;
    this.trackMin = (GRID.colMin - 1) * TILE;
    this.trackMax = (GRID.colMax + 1) * TILE;
    this.col = Math.round(x / TILE);
    mesh.position.set(x, 0, -row * TILE);
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