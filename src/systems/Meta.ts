// Banked money, high score, unlocks — persisted across runs.
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters';

export class Meta {
  money = 0;
  highScore = 0;
  unlocked = new Set<string>([DEFAULT_CHARACTER]);
  private readonly KEY = 'xroads.meta';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const p = JSON.parse(raw);
        this.money = p.money ?? 0;
        this.highScore = p.highScore ?? 0;
        if (Array.isArray(p.unlocked)) {
          this.unlocked = new Set(p.unlocked);
        }
        if (!this.unlocked.has(DEFAULT_CHARACTER)) {
          this.unlocked.add(DEFAULT_CHARACTER);
        }
      }
    } catch {
      /* storage unavailable — run in-memory only */
    }
  }

  private save() {
    try {
      localStorage.setItem(
        this.KEY,
        JSON.stringify({
          money: this.money,
          highScore: this.highScore,
          unlocked: Array.from(this.unlocked),
        }),
      );
    } catch {
      /* ignore */
    }
  }

  bank(coins: number) {
    this.money += coins;
    this.save();
  }

  newHigh(score: number) {
    if (score > this.highScore) {
      this.highScore = score;
      this.save();
    }
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  unlock(id: string): boolean {
    if (this.unlocked.has(id)) return true;
    const def = CHARACTERS.find((c) => c.id === id);
    if (!def) return false;
    if (this.money < def.cost) return false;
    this.money -= def.cost;
    this.unlocked.add(id);
    this.save();
    return true;
  }
}
