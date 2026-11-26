// Central tuning knobs. Keep all "feel" numbers here so balance/feel is easy to dial in.
export const TILE = 1.0; // world units per grid tile

// Playable column range (grid is clamped laterally; rows are unbounded).
export const GRID = { colMin: -7, colMax: 7 };

// Isometric-ish camera. North = +row = -Z. Camera sits behind (+Z) and above the player.
export const CAM = {
  height: 8.5, // camera Y
  back: 7.6, // distance behind player (Z)
  lookAhead: 2.2, // how far north the camera looks
  lookY: 0.5, // look-at height
  fov: 42,
  follow: 0.12, // per-frame lerp factor for smooth follow
};

// Discrete step tween.
export const MOVE = { stepDuration: 0.12 };

// How many rows to keep materialized around the player (chunk culling budget).
export const VISIBLE = { behind: 8, ahead: 24 };

// Traffic (road lanes): per-row deterministic speeds + car counts.
export const TRAFFIC = {
  minSpeed: 1.6, // tiles/sec
  maxSpeed: 3.3,
  minCars: 2,
  maxCars: 4,
};

// Water (river lanes): floating objects (logs / turtles) that the player can ride.
export const WATER = {
  minSpeed: 1.0, // tiles/sec
  maxSpeed: 2.4,
  minObjs: 1,
  maxObjs: 3,
  minWidth: 1, // tiles
  maxWidth: 3,
};

// Rail (railroad lanes): train convoys that kill on contact.
export const RAIL = {
  minSpeed: 1.2, // tiles/sec
  maxSpeed: 2.8,
  minLength: 3, // segments per train
  maxLength: 6,
  minTrains: 1,
  maxTrains: 2,
};

// Car body colors (hex).
export const CAR_COLORS = [0xd9534f, 0x4f8fd9, 0xf0d433, 0x4fb56a, 0x95a5a6, 0xf2f2f2];

// Log / turtle colors (hex).
export const LOG_COLORS = [0x8b5a2b, 0xa06232, 0x6f4e2c, 0x5d3a1a];
export const TURTLE_COLORS = [0x4caf50, 0x388e3c, 0x2e7d32, 0x1b5e20];

// Train colors (hex) and telegraph pole color.
export const TRAIN_COLORS = [0x2b2f33, 0x4a4a4a, 0x6b6b6b, 0x8a8a8a, 0x555555];
export const TELEGRAPH_COLOR = 0x5d4037;

// Eagle (forces forward progress): appears when the player lingers on a row too long.
export const EAGLE = {
  idleWarning: 8.0,   // seconds of no forward progress before eagle appears
  idleGrab: 12.0,     // seconds before eagle grabs (after appearing)
  speed: 6.0,         // tiles/sec dive speed
  color: 0x3d3d3d,    // eagle body color
  shadowColor: 0x000000, // shadow color
};

// Coins (collectible currency): spawn on lanes, collected by stepping on their cell.
export const COIN = {
  minPerRow: 0,   // min coins per eligible row
  maxPerRow: 2,   // max coins per eligible row
  chance: 0.35,   // probability a row gets coins
  value: 1,       // money value per coin
};

// Death sequence timing (seconds).
export const DEATH = { freeze: 0.9, squish: 0.5 };