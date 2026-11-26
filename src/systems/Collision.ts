import type { Player } from '../entities/Player';
import type { Traffic } from './Traffic';
import type { Rail } from '../entities/Train';

// Grid-based hazard detection: the player dies if they share a cell with a car.
export class Collision {
  check(player: Player, traffic: Traffic): boolean {
    const cars = traffic.carsInRow(player.row);
    for (const c of cars) {
      if (c.col === player.col) return true; // same cell -> hit
    }
    return false;
  }

  // Train kills if the player's col falls within any train's occupied span.
  checkTrain(player: Player, rail: Rail): boolean {
    const trains = rail.trainsInRow(player.row);
    for (const t of trains) {
      if (t.occupies(player.col)) return true;
    }
    return false;
  }
}