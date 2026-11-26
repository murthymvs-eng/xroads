// Tracks distance (highest row reached) and coins for the run.
export class Scoring {
  distance = 0;
  coins = 0;

  constructor(private source: { readonly row: number }) {}

  update(): void {
    this.distance = Math.max(this.distance, this.source.row);
  }

  reset(): void {
    this.distance = 0;
    this.coins = 0;
  }
}