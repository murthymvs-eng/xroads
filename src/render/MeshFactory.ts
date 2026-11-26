import * as THREE from 'three';
import { TILE } from '../data/tuning';
import { LANE_COLORS, type LaneType } from '../data/laneConfig';
import { LOG_COLORS, TURTLE_COLORS } from '../data/tuning';
import { TRAIN_COLORS, TELEGRAPH_COLOR } from '../data/tuning';

// Builds and caches the low-poly meshes used by the world.
// All vehicles use proper 3D geometry (cylinders for wheels/logs/coins,
// detailed bodies with windows, headlights, bumpers, etc.) instead of
// flat rectangles.
export class MeshFactory {
  private tileGeo = new THREE.BoxGeometry(TILE, TILE, TILE);
  // Car geometry: hood, cabin, trunk sections
  private carHoodGeo = new THREE.BoxGeometry(0.34, 0.26, 0.48);
  private carCabinGeo = new THREE.BoxGeometry(0.4, 0.28, 0.4);
  private carTrunkGeo = new THREE.BoxGeometry(0.3, 0.22, 0.4);
  private carGlassGeo = new THREE.PlaneGeometry(0.34, 0.2);
  private wheelGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.14, 10);
  private hubcapGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8);
  private carDarkMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  private carGlassMat = new THREE.MeshLambertMaterial({ color: 0x111122, transparent: true, opacity: 0.7 });
  private carLightMat = new THREE.MeshLambertMaterial({ color: 0xfff0c0 });
  private tileMats = new Map<LaneType, THREE.MeshLambertMaterial>();
  private carMats = new Map<number, THREE.MeshLambertMaterial>();
  private logMats = new Map<number, THREE.MeshLambertMaterial>();
  private turtleMats = new Map<number, THREE.MeshLambertMaterial>();
  private trainMats = new Map<number, THREE.MeshLambertMaterial>();

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

  private trainMat(color: number): THREE.MeshLambertMaterial {
    let m = this.trainMats.get(color);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color });
      this.trainMats.set(color, m);
    }
    return m;
  }

  // Add four dark wheels with silver hubcaps to any vehicle group.
  private addWheels(g: THREE.Group, positions: [number, number, number][]): void {
    for (const [x, y, z] of positions) {
      const wheel = new THREE.Mesh(this.wheelGeo, this.carDarkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      g.add(wheel);
      const hubcap = new THREE.Mesh(this.hubcapGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
      hubcap.rotation.z = Math.PI / 2;
      hubcap.position.set(x, y, z + 0.072);
      g.add(hubcap);
    }
  }

  makeTile(type: LaneType, col: number, row: number): THREE.Mesh {
    const m = new THREE.Mesh(this.tileGeo, this.tileMat(type));
    m.position.set(col * TILE, 0, -row * TILE);
    return m;
  }

  // A proper car: hood + cabin + trunk + windows + headlights + taillights + 4 wheels.
  makeCar(color: number): THREE.Group {
    const g = new THREE.Group();
    const mat = this.carMat(color);
    const dark = this.carDarkMat;

    // Hood (front section)
    const hood = new THREE.Mesh(this.carHoodGeo, mat);
    hood.position.set(-0.32, 0.14, 0);
    // Cabin (middle section)
    const cabin = new THREE.Mesh(this.carCabinGeo, mat);
    cabin.position.set(0, 0.22, 0);
    // Trunk (rear section)
    const trunk = new THREE.Mesh(this.carTrunkGeo, mat);
    trunk.position.set(0.31, 0.12, 0);
    g.add(hood, cabin, trunk);

    // Windshield (front window)
    const windshield = new THREE.Mesh(this.carGlassGeo, this.carGlassMat);
    windshield.position.set(-0.2, 0.34, 0.241);
    windshield.rotation.y = Math.PI / 2;
    // Rear window
    const rearWindow = new THREE.Mesh(this.carGlassGeo, this.carGlassMat);
    rearWindow.position.set(0.41, 0.18, 0.241);
    rearWindow.rotation.y = Math.PI / 2;
    // Side windows
    const sideWindowL = new THREE.Mesh(this.carGlassGeo, this.carGlassMat);
    sideWindowL.position.set(-0.1, 0.3, 0.481);
    const sideWindowR = new THREE.Mesh(this.carGlassGeo, this.carGlassMat);
    sideWindowR.position.set(-0.1, 0.3, -0.481);
    g.add(windshield, rearWindow, sideWindowL, sideWindowR);

    // Headlights (front)
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), this.carLightMat);
    hl1.position.set(-0.35, 0.1, 0.241);
    const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), this.carLightMat);
    hl2.position.set(-0.35, 0.1, -0.241);
    // Taillights (rear)
    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), new THREE.MeshLambertMaterial({ color: 0xff3333 }));
    tl1.position.set(0.42, 0.08, 0.241);
    const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), new THREE.MeshLambertMaterial({ color: 0xff3333 }));
    tl2.position.set(0.42, 0.08, -0.241);
    g.add(hl1, hl2, tl1, tl2);

    // Bumpers (front and rear)
    const bumperMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.46), bumperMat);
    bumperF.position.set(-0.37, 0.06, 0);
    const bumperR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.44), bumperMat);
    bumperR.position.set(0.46, 0.04, 0);
    g.add(bumperF, bumperR);

    // Four wheels at the corners.
    const wheelPos: [number, number, number][] = [
      [-0.34, 0.07, 0.24],
      [0.34, 0.07, 0.24],
      [-0.34, 0.07, -0.24],
      [0.34, 0.07, -0.24],
    ];
    this.addWheels(g, wheelPos);
    return g;
  }

  // A floating log or turtle for river lanes. `width` is in grid cells.
  // Logs use a cylinder (proper log shape) instead of a flat box.
  makeFloat(kind: 'log' | 'turtle', color: number, width: number): THREE.Group {
    const g = new THREE.Group();

    if (kind === 'log') {
      // Log: cylindrical body with darker end rings.
      const bodyW = 0.78 * width;
      const bodyD = 0.45;
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(bodyD / 2, bodyD / 2, bodyW, 12),
        this.logMat(color),
      );
      body.rotation.z = Math.PI / 2;
      body.position.set(0, bodyD / 2, 0);
      g.add(body);

      // End rings (darker wood).
      const ringMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
      const ringGeo = new THREE.CylinderGeometry(bodyD / 2 + 0.03, bodyD / 2 + 0.03, 0.08, 12);
      const r1 = new THREE.Mesh(ringGeo, ringMat);
      r1.rotation.z = Math.PI / 2;
      r1.position.set(-bodyW / 2 - 0.04, bodyD / 2, 0);
      const r2 = new THREE.Mesh(ringGeo, ringMat);
      r2.rotation.z = Math.PI / 2;
      r2.position.set(bodyW / 2 + 0.04, bodyD / 2, 0);
      g.add(r1, r2);
    } else {
      // Turtle: domed shell + head + legs.
      const bodyW = 0.78 * width;
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(bodyW / 2.5, bodyW / 2.5, 0.18, 12),
        this.turtleMat(color),
      );
      shell.rotation.z = Math.PI / 2;
      shell.position.set(0, 0.2, 0);
      g.add(shell);

      // Domed shell top.
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(bodyW / 2.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        this.turtleMat(color),
      );
      dome.position.set(0, 0.29, 0);
      g.add(dome);

      // Head peeking out.
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.2, 0.26),
        this.turtleMat(color),
      );
      head.position.set(bodyW / 2.5 - 0.2, 0.3, 0);
      g.add(head);

      // Four legs.
      const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.18, 6);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
      const legPos: [number, number, number][] = [
        [-bodyW / 2.5 + 0.12, 0.11, 0.12],
        [bodyW / 2.5 - 0.12, 0.11, 0.12],
        [-bodyW / 2.5 + 0.12, 0.11, -0.12],
        [bodyW / 2.5 - 0.12, 0.11, -0.12],
      ];
      for (const [x, y, z] of legPos) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.rotation.z = Math.PI / 2;
        leg.position.set(x, y, z);
        g.add(leg);
      }
    }
    return g;
  }

  // A train segment: engine (larger, with cab + smokestack + cowcatcher) or car (freight).
  makeTrain(color: number, isEngine: boolean): THREE.Group {
    const g = new THREE.Group();
    const mat = this.trainMat(color);
    const dark = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    if (isEngine) {
      // Engine: boiler + cab + smokestack + cowcatcher + 4 wheels.
      const boiler = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.4, 0.6), mat);
      boiler.position.set(-0.05, 0.2, 0);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), mat);
      cab.position.set(0.3, 0.48, 0);
      const smokestack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8),
        dark,
      );
      smokestack.position.set(-0.25, 0.5, 0);
      // Cowcatcher at front
      const cowcatcher = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.5), dark);
      cowcatcher.position.set(-0.44, 0.14, 0);
      const wheelPos: [number, number, number][] = [
        [-0.34, 0.1, 0.22],
        [0.34, 0.1, 0.22],
        [-0.34, 0.1, -0.22],
        [0.34, 0.1, -0.22],
      ];
      this.addWheels(g, wheelPos);
      g.add(boiler, cab, smokestack, cowcatcher);
    } else {
      // Freight car: boxy with detail panel + 4 wheels.
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.4, 0.5), mat);
      body.position.set(0, 0.2, 0);
      const detail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.04), dark);
      detail.position.set(0, 0.44, 0.26);
      const wheelPos: [number, number, number][] = [
        [-0.3, 0.1, 0.18],
        [0.3, 0.1, 0.18],
        [-0.3, 0.1, -0.18],
        [0.3, 0.1, -0.18],
      ];
      this.addWheels(g, wheelPos);
      g.add(body, detail);
    }
    return g;
  }

  // A telegraph pole: wooden post with crossbar + insulators.
  makeTelegraphPole(): THREE.Group {
    const g = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: TELEGRAPH_COLOR });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), wood);
    post.position.set(0, 0.5, 0);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.08), wood);
    cross.position.set(0, 0.9, 0);
    // Small insulator discs.
    const insulatorGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8);
    const insulatorMat = new THREE.MeshLambertMaterial({ color: 0x2b2f33 });
    for (const x of [-0.18, 0.18]) {
      const ins = new THREE.Mesh(insulatorGeo, insulatorMat);
      ins.position.set(x, 0.9, 0);
      g.add(ins);
    }
    g.add(post, cross);
    return g;
  }

  // A coin: golden cylinder with darker rim, floating above the ground.
  makeCoin(): THREE.Group {
    const g = new THREE.Group();
    const gold = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const dark = new THREE.MeshLambertMaterial({ color: 0xb8860b });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 16), gold);
    body.position.set(0, 0.08, 0);
    body.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16), dark);
    rim.position.set(0, 0.17, 0);
    rim.rotation.x = Math.PI / 2;
    g.add(body, rim);
    return g;
  }
}