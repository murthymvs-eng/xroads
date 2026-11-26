// Lane/row types and generation weights. Traffic schedules grow in M1+.
export type LaneType = 'grass' | 'road' | 'river' | 'rail';

// Base weights for picking a row type (difficulty ramps can override these in M1+).
export const ROW_WEIGHTS: Record<LaneType, number> = {
  grass: 0.52,
  road: 0.32,
  river: 0.1,
  rail: 0.06,
};

export const LANE_COLORS: Record<LaneType, number> = {
  grass: 0x63b04a,
  road: 0x4d4d52,
  river: 0x3f8fe0,
  rail: 0x8a6b43,
};
