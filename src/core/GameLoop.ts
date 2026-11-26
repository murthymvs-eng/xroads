// Fixed-ish timestep loop: clamps dt so a long frame can't make physics jump.
export class GameLoop {
  private raf = 0;
  private last = 0;
  private running = false;
  private readonly maxDt = 1 / 20;

  constructor(private onUpdate: (dt: number) => void) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min((t - this.last) / 1000, this.maxDt);
      this.last = t;
      this.onUpdate(dt);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
