import * as THREE from 'three';
import { Entity } from './Entity';
import { TILE } from '../data/tuning';
import type { CharacterDef } from '../data/characters';
import type { MoveDir } from '../core/Input';

// Billboard sprite for a single character cell.
export class CharacterSprite extends Entity {
  readonly sprite: THREE.Sprite;
  readonly halfHeight: number;
  readonly baseW: number;
  readonly baseH: number;

  constructor(def: CharacterDef, tex: THREE.Texture) {
    super();
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    const w = 0.72;
    const aspect =
      tex.image && tex.image.width && tex.image.height ? tex.image.width / tex.image.height : 0.6;
    this.baseW = w;
    this.baseH = w / aspect;
    this.sprite.scale.set(this.baseW, this.baseH, 1);
    this.halfHeight = this.baseH / 2;
    this.place(0, 0);
  }

  place(col: number, row: number): void {
    this.col = col;
    this.row = row;
    this.toWorld();
  }

  toWorld(): void {
    this.world.set(this.col * TILE, this.halfHeight, -this.row * TILE);
  }

  // Uniform scale factor (1 = full size). Used for the death squish.
  scaleCharacter(f: number): void {
    this.sprite.scale.set(this.baseW * f, this.baseH * f, 1);
  }

  setFacing(_dir: MoveDir): void {
    /* direction frames arrive with art (M6+) */
  }
}