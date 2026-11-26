import * as THREE from 'three';
import { TILE } from '../data/tuning';
import { LANE_COLORS, type LaneType } from '../data/laneConfig';
import { LOG_COLORS, TURTLE_COLORS } from '../data/tuning';
import { TRAIN_COLORS, TELEGRAPH_COLOR } from '../data/tuning';

// Builds and caches the low-poly meshes used by the world.
export class MeshFactory {
  private tileGeo = new THREE.BoxGeometry(TILE, TILE, TILE);
  private carBodyGeo = new THREE.BoxGeometry(0.82, 0.34, 0.56);
  private carCabinGeo = new THREE.BoxGeometry(0.4, 0.26, 0.44);
  private carGlassGeo = new THREE.BoxGeometry(0.06, 0.2, 0.42);
  private carDarkMat = new THREE.MeshLambertMaterial({ color: 0x2b2f33 });
  private tileMats = new Map<LaneType, THREE.MeshLambertMaterial>();
  private carMats = new Map<number, THREE.MeshLambertMaterial>();
  private logMats = new Map<number, THREE.MeshLambertMaterial>();
  private turtleMats = new Map<number, THREE.MeshLambertMaterial>();

  private tileMat(type: LaneType): THREE.MeshLambertMaterial {
    let m = this.tileMats.get(type);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color: LANE_COLORS[type] });
      this.tileMats.set(type, m);
    }
    return m;
  }

  private carMat(color: number): THREE.MeshLambertMaterial {
    let m = this.carMats.get(color);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color });
      this.carMats.set(color, m);
    }
    return m;
  }

  private logMat(color: number): THREE.MeshLambertMaterial {
    let m = this.logMats.get(color);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color });
      this.logMats.set(color, m);
    }
    return m;
  }

  private turtleMat(color: number): THREE.MeshLambertMaterial {
    let m = this.turtleMats.get(color);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color });
      this.turtleMats.set(color, m);
    }
    return m;
  }

  makeTile(type: LaneType, col: number, row: number): THREE.Mesh {
    const m = new THREE.Mesh(this.tileGeo, this.tileMat(type));
    m.position.set(col * TILE, 0, -row * TILE);
    return m;
  }

  // A simple little car: body + cabin + windshield, sitting on the ground.
  makeCar(color: number): THREE.Group {
    const g = new THREE.Group();
    const mat = this.carMat(color);
    const body = new THREE.Mesh(this.carBodyGeo, mat);
    body.position.set(0, 0.17, 0);
    const cabin = new THREE.Mesh(this.carCabinGeo, mat);
    cabin.position.set(0, 0.4, -0.02);
    const glass = new THREE.Mesh(this.carGlassGeo, this.carDarkMat);
    glass.position.set(0.12, 0.4, -0.02);
    g.add(body, cabin, glass);
    return g;
  }

  // A floating log or turtle for river lanes. `width` is in grid cells.
  makeFloat(kind: 'log' | 'turtle', color: number, width: number): THREE.Group {
    const g = new THREE.Group();
    const bodyW = 0.78 * width;
    const bodyH = 0.28;
    const bodyD = 0.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), kind === 'log' ? this.logMat(color) : this.turtleMat(color));
    body.position.set(0, bodyH / 2, 0);
    g.add(body);

    if (kind === 'log') {
      // End rings for a log look.
      const ringGeo = new THREE.BoxGeometry(bodyW + 0.06, bodyH + 0.06, 0.06);
      const ringMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
      const r1 = new THREE.Mesh(ringGeo, ringMat);
      r1.position.set(0, bodyH / 2, -bodyD / 2 - 0.03);
      const r2 = new THREE.Mesh(ringGeo, ringMat);
      r2.position.set(0, bodyH / 2, bodyD / 2 + 0.03);
      g.add(r1, r2);
    } else {
      // Turtle head peeking out.
      const headGeo = new THREE.BoxGeometry(0.26, 0.2, 0.26);
      const head = new THREE.Mesh(headGeo, this.turtleMat(color));
      head.position.set(bodyW / 2 - 0.22, bodyH / 2 + 0.1, 0);
      g.add(head);
    }
    return g;
  }

  // A train segment: engine (larger, with cab) or car (boxy).
  makeTrain(color: number, isEngine: boolean): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color });
    const dark = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    if (isEngine) {
      // Engine: longer body + cab on top.
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.42, 0.6), mat);
      body.position.set(0, 0.21, 0);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), mat);
      cab.position.set(0.18, 0.5, 0);
      const wheelGeo = new THREE.BoxGeometry(0.1, 0.22, 0.1);
      const w1 = new THREE.Mesh(wheelGeo, dark);
      w1.position.set(-0.3, 0.1, 0.22);
      const w2 = new THREE.Mesh(wheelGeo, dark);
      w2.position.set(0.3, 0.1, 0.22);
      const w3 = new THREE.Mesh(wheelGeo, dark);
      w3.position.set(-0.3, 0.1, -0.22);
      const w4 = new THREE.Mesh(wheelGeo, dark);
      w4.position.set(0.3, 0.1, -0.22);
      g.add(body, cab, w1, w2, w3, w4);
    } else {
      // Car: boxy freight car.
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.4, 0.5), mat);
      body.position.set(0, 0.2, 0);
      const detail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.04), dark);
      detail.position.set(0, 0.44, 0.26);
      const wGeo = new THREE.BoxGeometry(0.1, 0.2, 0.1);
      const w1 = new THREE.Mesh(wGeo, dark);
      w1.position.set(-0.28, 0.1, 0.18);
      const w2 = new THREE.Mesh(wGeo, dark);
      w2.position.set(0.28, 0.1, 0.18);
      const w3 = new THREE.Mesh(wGeo, dark);
      w3.position.set(-0.28, 0.1, -0.18);
      const w4 = new THREE.Mesh(wGeo, dark);
      w4.position.set(0.28, 0.1, -0.18);
      g.add(body, detail, w1, w2, w3, w4);
    }
    return g;
  }

  // A telegraph pole: wooden post with crossbar, static decoration.
  makeTelegraphPole(): THREE.Group {
    const g = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: TELEGRAPH_COLOR });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), wood);
    post.position.set(0, 0.5, 0);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.08), wood);
    cross.position.set(0, 0.9, 0);
    g.add(post, cross);
    return g;
  }

  // A coin: golden cylinder floating slightly above the ground.
  makeCoin(): THREE.Mesh {
    const g = new THREE.Group();
    const gold = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const dark = new THREE.MeshLambertMaterial({ color: 0xb8860b });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 16), gold);
    body.position.set(0, 0.1, 0);
    body.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 16), dark);
    rim.position.set(0, 0, 0);
    rim.rotation.x = Math.PI / 2;
    g.add(body, rim);
    return g as unknown as THREE.Mesh;
  }
}