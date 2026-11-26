import type { Player } from '../entities/Player';
import type { Grid } from '../world/Grid';
import type { Input } from '../core/Input';

// Turns input into discrete grid steps. Riding/blocking logic (M1+) slots in here.
export class Movement {
  constructor(
    private player: Player,
    private grid: Grid,
    private input: Input,
  ) {}

  update(dt: number) {
    const d = this.input.consume();
    if (d) this.player.tryStep(d, { min: this.grid.colMin, max: this.grid.colMax });
    this.player.update(dt);
  }
}
