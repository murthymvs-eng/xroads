import * as THREE from 'three';

// Death-juice particle system: small colored squares that explode outward from
// a point, fade, and are recycled. Rendered as a single Points mesh.
export class Particles {
  private readonly points: THREE.Points;
  private readonly count = 40;
  private readonly positions = new Float32Array(this.count * 3);
  private readonly colors = new Float32Array(this.count * 3);
  private readonly sizes = new Float32Array(this.count);
  private readonly life = new Float32Array(this.count);
  private readonly vel = new Float32Array(this.count * 3);
  private active = 0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.resetAll();
  }

  private resetAll(): void {
    for (let i = 0; i < this.count; i++) this.life[i] = 0;
    this.active = 0;
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  // Spawn `n` particles bursting from (x, y, z).
  burst(x: number, y: number, z: number, n: number, color: number): void {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    let spawned = 0;
    for (let i = 0; i < this.count && spawned < n; i++) {
      if (this.life[i] > 0) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = 0.35 + Math.random() * 0.9;
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y + 0.3;
      this.positions[i * 3 + 2] = z;
      this.vel[i * 3] = Math.cos(a) * sp;
      this.vel[i * 3 + 1] = 0.6 + Math.random() * 0.6;
      this.vel[i * 3 + 2] = Math.sin(a) * sp;
      this.life[i] = 0.5 + Math.random() * 0.5;
      this.colors[i * 3] = r / 255;
      this.colors[i * 3 + 1] = g / 255;
      this.colors[i * 3 + 2] = b / 255;
      this.sizes[i] = 0.12 + Math.random() * 0.18;
      this.active++;
      spawned++;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    this.points.geometry.attributes.size.needsUpdate = true;
  }

  update(dt: number): void {
    let any = false;
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const t = this.life[i];
      if (t <= 0) {
        this.life[i] = 0;
        this.active--;
        continue;
      }
      any = true;
      this.positions[i * 3] += this.vel[i * 3] * dt;
      this.positions[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3 + 1] -= 1.2 * dt; // gravity
      this.sizes[i] *= 0.92;
      this.colors[i * 3 + 1] *= 0.98; // warm fade
    }
    if (any) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.size.needsUpdate = true;
      this.points.geometry.attributes.color.needsUpdate = true;
    }
    this.points.visible = this.active > 0;
  }

  dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

