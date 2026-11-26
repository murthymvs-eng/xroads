export type MoveDir = 'up' | 'down' | 'left' | 'right';

const KEYMAP: Record<string, MoveDir> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

// Keys that trigger a restart when on the Game Over screen.
const RESTART_KEYS = new Set([
  'Space',
  'Enter',
  'KeyR',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
]);

// Keyboard input, read once per frame so a held key advances a step per frame.
export class Input {
  private latest: MoveDir | null = null;
  private restart = false;

  private onKey = (e: KeyboardEvent) => {
    const d = KEYMAP[e.code];
    if (d) {
      this.latest = d;
      e.preventDefault();
    }
    if (RESTART_KEYS.has(e.code) && !e.repeat) {
      this.restart = true;
      e.preventDefault();
    }
  };
  private onBlur = () => {
    this.latest = null;
  };

  attach(): void {
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('blur', this.onBlur);
  }
  detach(): void {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('blur', this.onBlur);
  }

  consume(): MoveDir | null {
    const d = this.latest;
    this.latest = null;
    return d;
  }

  consumeRestart(): boolean {
    const r = this.restart;
    this.restart = false;
    return r;
  }

  clear(): void {
    this.latest = null;
    this.restart = false;
  }
}