import * as THREE from 'three';
import { CharacterSprite } from './CharacterSprite';
import { TILE, MOVE } from '../data/tuning';
import type { CharacterDef } from '../data/characters';
import type { MoveDir } from '../core/Input';
import type { FloatingObject } from './FloatingObject';

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

// The controllable character. Moves in discrete, tweened grid steps (one cell at
// a time), clamped to the lateral bounds. `col`/`row` hold the logical cell.
export class Player extends CharacterSprite {
  private stepFrom = new THREE.Vector3();
  private stepTo = new THREE.Vector3();
  private stepT = 1;
  isMoving = false;
  lastDir: MoveDir = 'up';

  // Riding state: the object being ridden and the x offset (world units) from
  // its center. While riding, world.x = riding.x + rideX.
  riding: FloatingObject | null = null;
  rideX = 0;

  constructor(def: CharacterDef, tex: THREE.Texture) {
    super(def, tex);
  }

  get canStep(): boolean {
    return !this.isMoving;
  }

  tryStep(dir: MoveDir, bounds: { min: number; max: number }): boolean {
    if (this.isMoving) return false;
    this.lastDir = dir;

    // While riding, left/right shift position on the log instantly (no tween);
    // up/down step off the river onto the adjacent row.
    if (this.riding) {
      if (dir === 'left' || dir === 'right') {
        const step = dir === 'left' ? -TILE : TILE;
        this.rideX += step;
        this.world.x = this.riding.x + this.rideX;
        this.col = Math.round(this.world.x / TILE);
        this.sprite.position.copy(this.world);
        return true;
      }
      // Up/down: step off the object.
      this.riding = null;
      this.rideX = 0;
    }

    const nc = this.col + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0);
    const nr = this.row + (dir === 'up' ? 1 : dir === 'down' ? -1 : 0);
    if (nc < bounds.min || nc > bounds.max) return false;

    this.stepFrom.copy(this.world);
    this.stepTo.set(nc * TILE, this.halfHeight, -nr * TILE);
    this.col = nc;
    this.row = nr;
    this.stepT = 0;
    this.isMoving = true;
    return true;
  }

  override update(dt: number): void {
    if (this.isMoving) {
      this.stepT = Math.min(1, this.stepT + dt / MOVE.stepDuration);
      const e = easeOut(this.stepT);
      this.world.lerpVectors(this.stepFrom, this.stepTo, e);
      this.world.y = this.stepTo.y * e + 0.12 * Math.sin(Math.PI * e);
      if (this.stepT >= 1) this.isMoving = false;
    }

    // While riding, follow the floating object continuously.
    if (this.riding && !this.isMoving) {
      this.world.x = this.riding.x + this.rideX;
      this.col = Math.round(this.world.x / TILE);
    }

    this.sprite.position.copy(this.world);
  }

  // Restore to a fresh run.
  reset(): void {
    this.isMoving = false;
    this.stepT = 1;
    this.riding = null;
    this.rideX = 0;
    this.scaleCharacter(1);
    this.place(0, 0);
    this.sprite.position.copy(this.world);
  }
}