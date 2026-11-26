import * as THREE from 'three';
import { CAM } from '../data/tuning';

// Fixed-angle follow camera: behind (+Z) and above the player, looking slightly
// north. Lerp gives a smooth trailing feel. Supports a decaying screen-shake
// offset applied to the camera position each frame.
export class CameraRig {
  private target = new THREE.Vector3();
  private shake = 0;      // current shake intensity (world units)
  private shakeDecay = 0; // per-second decay rate

  constructor(private cam: THREE.PerspectiveCamera) {}

  // Trigger a screen shake. intensity = world units, duration = seconds.
  shakeCamera(intensity: number, duration: number): void {
    this.shake = Math.max(this.shake, intensity);
    this.shakeDecay = intensity / duration;
  }

  update(player: THREE.Vector3) {
    const desired = new THREE.Vector3(player.x, CAM.height, player.z + CAM.back);
    this.cam.position.lerp(desired, CAM.follow);

    // Apply decaying random shake offset.
    if (this.shake > 0.005) {
      const ox = (Math.random() - 0.5) * this.shake;
      const oy = (Math.random() - 0.5) * this.shake;
      this.cam.position.x += ox;
      this.cam.position.y += oy;
      this.shake -= this.shakeDecay * (1 / 60);
      if (this.shake < 0) this.shake = 0;
    }

    this.target.set(player.x, CAM.lookY, player.z - CAM.lookAhead);
    this.cam.lookAt(this.target);
  }
}
