import * as THREE from 'three';

// Base actor: integer grid position + a continuous world position.
export class Entity {
  col = 0;
  row = 0;
  readonly world = new THREE.Vector3();

  update(_dt: number) { /* subclass hook */ }
}
