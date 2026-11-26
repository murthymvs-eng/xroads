import * as THREE from 'three';
import { CAM } from '../data/tuning';

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene.background = new THREE.Color(0x8fd3f4);
    this.scene.fog = new THREE.Fog(0x8fd3f4, 16, 42);

    this.camera = new THREE.PerspectiveCamera(CAM.fov, 1, 0.1, 200);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.9);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(6, 12, 4);
    this.scene.add(dir);
  }

  setBackground(tex: THREE.Texture): void {
    this.scene.background = tex;
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
