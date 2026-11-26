import type { LaneType } from '../data/laneConfig';

// One row of the world. Traffic schedule (vehicles/trains/logs) is added in M1+.
export class Lane {
  constructor(
    readonly row: number,
    readonly type: LaneType,
  ) {}
}
