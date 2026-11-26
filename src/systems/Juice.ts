// M7: particles, squash-and-stretch, screen shake, slow-mo death, per-char barks.
export class Juice {
  shake = 0;

  addShake(a: number) {
    this.shake = Math.min(1, this.shake + a);
  }

  update(dt: number) {
    this.shake = Math.max(0, this.shake - dt * 2.5);
  }
}
