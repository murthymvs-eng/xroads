import * as THREE from 'three';
import { Entity } from './Entity';
import { TILE, GRID, EAGLE } from '../data/tuning';
import { MeshFactory } from '../render/MeshFactory';

// The eagle forces forward progress. It tracks the player's row and, if the
// player lingers without advancing to a new row, the eagle appears (shadow
// telegraph) then dives to grab them → death. Moving to a new row resets the
// timer.
export class Eagle extends Entity {
  // Visual meshes.
  readonly shadow: THREE.Mesh;   // dark oval on the ground (telegraph)
  readonly body: THREE.Group;    // the bird itself (above the ground)

  // State.
  phase: 'idle' | 'warning' | 'diving' | 'grabbing' = 'idle';
  phaseT = 0; // seconds within current phase

  // The row the eagle is currently watching.
  watchRow = 0;

  constructor(scene: THREE.Scene, factory: MeshFactory) {
    super();

    // Shadow: a flat dark ellipse on the ground, only visible during warning.
    const shadowGeo = new THREE.CircleGeometry(0.5, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: EAGLE.shadowColor,
      transparent: true,
      opacity: 0,
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02; // sit just above the ground
    scene.add(this.shadow);

    // Body: a simple bird — body + wings + head.
    this.body = new THREE.Group();
    const birdMat = new THREE.MeshLambertMaterial({ color: EAGLE.color });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.25), birdMat);
    torso.position.set(0, 0.4, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.22), birdMat);
    head.position.set(0.32, 0.48, 0);
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.06), darkMat);
    beak.position.set(0.46, 0.48, 0);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.05), birdMat);
    wingL.position.set(-0.28, 0.4, 0);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.05), birdMat);
    wingR.position.set(0.28, 0.4, 0);
    this.body.add(torso, head, beak, wingL, wingR);
    this.body.position.y = 2.5; // start high above
    scene.add(this.body);

    this.col = 0;
    this.row = 0;
    this.world.set(0, 0, 0);
  }

  // Begin watching a row (called when the player lands on a new row).
  watch(row: number, col: number): void {
    this.watchRow = row;
    this.col = col;
    this.row = row;
    this.world.set(col * TILE, 0, -row * TILE);
    this.shadow.position.copy(this.world);
    this.body.position.set(col * TILE, 2.5, -row * TILE);
    this.phase = 'idle';
    this.phaseT = 0;
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0;
  }

  // Advance time. Returns true when the eagle grabs (death should follow).
  tick(dt: number, playerCol: number, playerRow: number): boolean {
    const shadowMat = this.shadow.material as THREE.MeshBasicMaterial;

    if (this.phase === 'idle') {
      // If the player is still on the watched row, accumulate idle time.
      if (playerRow === this.watchRow) {
        this.phaseT += dt;
        if (this.phaseT >= EAGLE.idleWarning) {
          this.phase = 'warning';
          this.phaseT = 0;
          shadowMat.opacity = 0.55;
        }
      }
      return false;
    }

    if (this.phase === 'warning') {
      this.phaseT += dt;
      // Pulse the shadow opacity.
      shadowMat.opacity = 0.55 + 0.25 * Math.sin(this.phaseT * 8);
      if (this.phaseT >= EAGLE.idleGrab - EAGLE.idleWarning) {
        this.phase = 'diving';
        this.phaseT = 0;
      }
      return false;
    }

    if (this.phase === 'diving') {
      this.phaseT += dt;
      const t = Math.min(1, this.phaseT / 0.6); // dive takes 0.6s
      // Dive from high above down to the player's cell.
      const y = 2.5 * (1 - t);
      this.body.position.y = y;
      shadowMat.opacity = 0.55 + 0.25 * Math.sin(this.phaseT * 10);
      if (t >= 1) {
        this.phase = 'grabbing';
        this.phaseT = 0;
        this.body.position.set(playerCol * TILE, 0.35, -playerRow * TILE);
        return true; // grabbed!
      }
      return false;
    }

    // grabbing: hold for a moment then stay grabbed.
    this.phaseT += dt;
    return false;
  }

  dispose(): void {
    this.shadow.geometry.dispose();
    (this.shadow.material as THREE.Material).dispose();
    this.body.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    });
  }
}

// Manages the single eagle that pressures the player to keep moving forward.
export class EagleSystem {
  private eagle: Eagle;
  private lastRow = -1; // track when the player advances to a new row

  constructor(scene: THREE.Scene, factory: MeshFactory) {
    this.eagle = new Eagle(scene, factory);
  }

  // Call each frame while playing. Returns true if the eagle grabbed the player.
  tick(dt: number, player: { row: number; col: number; world: { x: number; y: number; z: number } }): boolean {
    // Reset the eagle when the player advances to a new row.
    if (player.row !== this.lastRow) {
      this.lastRow = player.row;
      this.eagle.watch(player.row, player.col);
    }

    return this.eagle.tick(dt, player.col, player.row);
  }

  // Whether the eagle is currently in warning/diving/grabbing phase (for UI).
  get active(): boolean {
    return this.eagle.phase !== 'idle';
  }

  // Current phase for debug/UI.
  get phase(): string {
    return this.eagle.phase;
  }

  // Reset the eagle for a fresh run.
  reset(): void {
    this.lastRow = -1;
    this.eagle.phase = 'idle';
    this.eagle.phaseT = 0;
    (this.eagle.shadow.material as THREE.MeshBasicMaterial).opacity = 0;
  }

  dispose(): void {
    this.eagle.dispose();
  }
}
