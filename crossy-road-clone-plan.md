# Crossy Road — Clone Plan
_Target: replicate the web game embedded at
`https://crossy-road.io/cross-road-unblocked-76`
(the "Cross Road Unblocked 76" unblocked build of Crossy Road)._

_Last updated: 2026-11-24 · Source analyzed: live scrape + GitHub repo `crossy-road-unblock/crossy-road-unblock.github.io`_

---

## 1. What We're Cloning (Verified Facts)

**Embed chain (scraped):**
```
crossy-road.io/cross-road-unblocked-76
  └─ <iframe src="/cross-road-unblocked-76.embed">          # "PLAY NOW" gate
       └─ JS: start_game_frame() → src =
          https://crossy-road-unblock.github.io/crossy-road/  # the real game
```

**Tech stack (confirmed from repo + JS):**
| File | Size | Role |
|---|---|---|
| `scripts/three.min.js` | 552 KB | **Three.js — WebGL 3D renderer** |
| `scripts/game.min.js` | 2.73 MB | **All game logic** (bundled) |
| `scripts/asset-loader.min.js` | 11 KB | Custom async asset loader |
| `scripts/bootstrap.min.js` | 64 KB | Webpack entry / boot, Storage wrapper |
| `scripts/tween.min.js` | 6 KB | Tween/animation |
| `scripts/extra.min.js` | 4 KB | Helpers |
| `poki-sdk.js` | 161 KB | Poki leaderboards / ad / anti-cheat SDK |
| `index.html`, `style.css` | — | Boot + page shell |

**Rendering:** Three.js WebGL, fixed slightly-bank isometric camera, `requestAnimationFrame` loop. (The bootstrap also probes `getContext('2d'/'webgl')` for a screenshot/fallback canvas.)

**Assets (repo `crossy-road/`):**
- `sprites/` → `tiled-bg.png` (world tileset: grass/road/river/rail), character PNGs (`chicken.png`, `hipster-1..3.png`, `hipster-whale.png`, `trex.png`, `whale-1..3.png`), `interface.png` + `interface.json` (UI atlas), `particles.png`, `pause.png`, `crossy-road-logo.png`, poki/upsell branding.
- `fonts/` → `8-bit-wonder` (pixel display font: `.png` atlas + `.json` + `-yellow.png`), `editundobrk` (`woff2` webfont + `top-numbers.json` for big score digits).
- `audio/` → **83 files** (`.mp4` = AAC in MP4 container, played via Web Audio/`<audio>`): car/truck hits, horns, `chickendeath`, eagle/hawk screech, train-pass/trainsplat, logjump, watersplash, `get-coin-79`, `pop-1..9`, prize/slot sounds, per-character barks (chicken `buck1..12`, cat, mallard, robot).
- `plain-audio/splashintro.mp4` (intro SFX).

**Gameplay (Crossy Road mechanics to replicate):**
- Top-down isometric **grid**; player = one character; **discrete one-tile steps** in 4 directions (tap/keys). Endless scroll upward.
- **Lane types** (stacked as rows you advance through):
  - **Grass** — safe ground.
  - **Road** — cars/trucks/buses driving both directions at varying speeds.
  - **River** — deadly water; cross by riding **logs / turtles / frogs** (they drift & can push you off).
  - **Railroad** — **trains** (long convoys, telegraphed, deadly).
- **Hazards/one-hit death:** car, truck, train, drowning (standing on water), eagle.
- **Eagle:** telegraphed fly-by that grabs the **front-most** character in the center of view; must not be the leader when it strikes.
- **Score = distance** = furthest northward grid row reached (going back doesn't reduce it).
- **Money / coins** spawn on tiles (some in dangerous spots); banked across runs to **unlock characters** (cosmetic; full game ~40, this web build exposes fewer: chicken, hipster, T-Rex, whale, robot).
- **Meta:** high score, persistent money, character select/unlock.
- **Feel:** cute low-poly/cartoon 3D, squash-and-stretch on steps, particles, screen shake on death, snappy SFX.


---

## 2. Goals & Non-Goals

**Goals**
- A playable browser game that is *functionally* Crossy Road: same core loop, lane mechanics, scoring, eagle, coins/unlocks, and "feel."
- Runs at 60fps on desktop + mobile; keyboard + mouse + touch.
- Clean modular architecture that maps to the original's systems.

**Non-Goals**
- Not an asset-perfect rip-off (unless you choose the "asset-reuse" route in §6).
- No live anti-cheat / paid ad integration (Poki SDK is optional).

**IP note:** *Game mechanics* are not copyrightable (safe to clone). The *specific art, characters, pixel font, SFX, and the name "Crossy Road"* are protected. To ship publicly and stay clean: rename it, build **original** low-poly/cartoon art, generate or record **original** SFX, and use an original display font. (Route A in §6 = pixel-perfect but legally gray; Route B = original art.)

---

## 3. Recommended Tech Stack

**Primary (matches the original's fidelity):**
- **Three.js** (WebGL) for 3D isometric rendering — matches the real game's look (depth, model shading, particles).
- **Vanilla TS/JS + Vite** (ESM). No heavy engine needed; Three.js + a tiny tween util + a game loop is enough.
- **Web Audio API** for SFX (preload into `AudioBuffer`s; needs a user gesture to unlock audio).
- **localStorage** for persistence (money, high score, unlocked characters, mute).
- **Poki-style leaderboard optional** (or your own) — skip for MVP.

**Lighter alternative:** a **Canvas 2D** isometric renderer (pre-baked isometric sprites + parallax) is far simpler and looks ~90% identical because the camera is fixed-angle. Choose this if you want lower engine risk / smaller bundle. The gameplay systems below are renderer-agnostic.

**Suggested libraries (all small / permissive):**
- `three` (WebGL), `@types/three`
- `@tweenjs/tween.js` or a 20-line homegrown tween (the original uses a tiny tween)
- `zustand` or plain state object for game/meta state
- Test: `vitest` + `node`; visual regression optional (Playwright)

---

## 4. Architecture

```
index.html
└─ src/
   ├─ main.ts               # entry: boot → AssetLoader → Game.start()
   ├─ core/
   │  ├─ Game.ts            # orchestrator: owns state machine + systems
   │  ├─ GameLoop.ts        # fixed-timestep update + rAF render, dt clamp
   │  ├─ GameState.ts       # enum: BOOT, MENU, PLAYING, DYING, GAME_OVER
   │  ├─ Input.ts           # keyboard / mouse / touch → "move(dir)" intents
   │  └─ RNG.ts             # seeded, deterministic (replays/testing)
   ├─ world/
   │  ├─ Grid.ts            # integer lattice; (col,row); get/set entity
   │  ├─ Lane.ts            # one row's type + traffic schedule
   │  ├─ WorldGenerator.ts  # procedural, chunked (as player advances)
   │  └─ ChunkManager.ts    # spawn/kill rows by camera distance (GC)
   ├─ entities/
   │  ├─ Entity.ts          # base: pos, grid pos, mesh, update, onHit
   │  ├─ Player.ts
   │  ├─ Vehicle.ts         # car/truck/bus/police — per-lane mover
   │  ├─ Train.ts           # convoy (multi-cell)
   │  ├─ Log.ts / Turtle.ts # river movers (rideable)
   │  ├─ Eagle.ts
   │  ├─ Coin.ts
   │  └─ CharacterSprite.ts # per-character look + bark SFX
   ├─ systems/
   │  ├─ Movement.ts        # step resolution, riding, blocking, landing
   │  ├─ Traffic.ts         # lane movers (cars/trains/logs) update
   │  ├─ Collision.ts       # grid AABB overlaps → death / coin pickup
   │  ├─ Scoring.ts         # distance (max row) + coin/money
   │  ├─ EagleLogic.ts      # telegraph + strike window
   │  ├─ Meta.ts            # money, unlocks, high score
   │  └─ Juice.ts           # particles, screen shake, squash, tweens
   ├─ render/
   │  ├─ SceneManager.ts    # three Scene, camera, lights, fog, ground
   │  ├─ Camera.ts          # follows player (row), bank/clamp
   │  ├─ MeshFactory.ts     # build meshes from sprites/tileset
   │  └─ Particles.ts
   ├─ audio/
   │  ├─ AudioManager.ts    # Web Audio, pooling, mute, volume
   │  └─ sfx.ts             # sfx → (file, params) map
   ├─ data/
   │  ├─ laneConfig.ts      # lane weights, speeds, spawn rates, per-difficulty
   │  ├─ characters.ts      # roster, art, cost, barks
   │  └─ tuning.ts          # all magic numbers in one place
   └─ ui/
      ├─ Hud.ts             # score + money (DOM overlay)
      ├─ Menu.ts / GameOver.ts
      └─ CharacterSelect.ts
```

**Key data model — the grid:**
- Infinite integer lattice. `row` increases **north** (away from camera). Player tracks `(col,row)`.
- A `Lane` = one `row`, has a `type` and a **traffic schedule** (vehicle spawn timing, direction, speed, spacing).
- `WorldGenerator` decides each new row's type by weighted rules + difficulty ramp, **seeded** so a run is reproducible (great for testing).
- `ChunkManager` only materializes rows within ~[camera-5 .. camera+40] and GCs the rest (keeps entity count + draw calls bounded → 60fps).


---

## 5. Core Systems — Detailed Specs

### 5.1 Movement (`Movement.ts`)
- Player holds `gridPos` (int) and `worldPos` (float vec3). A `move(dir)` intent from input, when allowed, starts a **step tween** (~0.1s): lerp `worldPos` to the adjacent cell with a small arc + squash.
- Rules during a step:
  - One step at a time; ignore/buffer the next input at the step's midpoint for responsiveness.
  - **Riding:** if the destination is a Log/Turtle/Vehicle (safe carrier), player locks to that carrier and is carried along; re-evaluate each frame.
  - **Water:** stepping onto bare water without a carrier → drown (splash + death).
  - **Blocking:** can't move into an occupied solid cell (vehicle/train) at your column.
  - **Riding + off-screen:** a log/vehicle carrying you off the visible grid = death.
- Facing: character rotates to movement direction; idle animation when still.

### 5.2 Lane Generation (`WorldGenerator.ts`)
- Build rows on demand. Per row pick a `LaneType` by weighted table that changes with distance (e.g., early = mostly grass/single road; later = rivers, double roads, rail + river stacks).
- Enforce constraints: not two rail rows back-to-back; a river is 1–3 rows deep; roads get a **traffic schedule** (vehicle types, speeds 1–4, direction, spawn interval, max concurrent).
- Deterministic via `RNG`; expose difficulty curve (speed/density up with row).
- Place **coins** sparsely, with bias toward risky tiles (on logs, on road, near trains) for the risk/reward loop.

### 5.3 Traffic (`Traffic.ts`)
- Each lane runs its own **scheduler**: spawn movers at intervals; movers move at constant lane speed; wrap/respawn.
- **Vehicle:** single-cell (or 2-cell truck/bus) box; constant speed; both directions on a road lane.
- **Train:** a convoy of N cells that sweeps the whole lane; **telegraph** (clack + warning) then passes; the whole lane is lethal for the pass duration.
- **Log/Turtle:** river movers; drift horizontally; logs can carry the player; turtles/frogs are safe stand-on platforms (optionally they duck/hide — keep as tunable).
- Update all movers in fixed steps so collisions are deterministic and testable.

### 5.4 Collision & Death (`Collision.ts`)
- After each update, check overlap of player cell (and its sub-cell during steps) against hazards:
  - Vehicle / Train occupies player cell → **hit** (squish) → `DIE`.
  - Water under player with no carrier → **drown** → `DIE`.
  - Eagle strike window open **and** player is the front-most (see 5.6) → **grabbed** → `DIE`.
- Coin overlap → collect (+money, `pop` SFX, particles).
- On death → `DYING` state (freeze hazards, play death SFX, screen shake, slow-mo), then `GAME_OVER`.

### 5.5 Scoring & Distance (`Scoring.ts`)
- `score = max(rows advanced north, 0)` — moving down never reduces it.
- `money` accumulates from coins (+ optional per-row bonus) and is **banked** across runs (persistence).
- High score persisted.

### 5.6 Eagle (`EagleLogic.ts`)
- Runs on a timer / cooldown; before striking, show **telegraph** (eagle silhouette across the sky + screech) for `telegraphMs`.
- Strike: eagle drops onto the **center column of view, front row** (the "leading" position). If the player is in that cell (and not on a carrier that moves them), they're grabbed.
- Fairness: never strike the very first few rows; cooldown so it's a rhythm, not a wall.

### 5.7 Meta / Unlocks (`Meta.ts`)
- Persist `{ money, highScore, unlockedChars[], selectedChar, muted }` to `localStorage` (the original uses a `Storage` wrapper with a fallback for disabled localStorage — replicate that fallback).
- `characters.ts`: roster with `{ id, cost, artRef, barkSfx, unlockRule }`. Character select is cosmetic.

### 5.8 Camera (`Camera.ts`)
- Fixed isometric-ish Three.js camera; follow the **player's row** smoothly (lerp), clamped so it never looks behind the start row.
- Small look-ahead + subtle shake on death.

### 5.9 Rendering (`render/`)
- Three.js `Scene`: hemisphere/directional light, fog for depth, a big ground built from `tiled-bg.png` (tiled/instanced per row type).
- Characters & vehicles as textured meshes or sprite-billboards from `sprites/` (originals are flat-ish, so billboarded sprites with correct depth sort are acceptable and cheap).
- **Depth sort** by (row+col) so nearer objects overdraw — critical for the isometric look.
- Particles for hops, splashes, coin pops, death.

### 5.10 Audio (`audio/`)
- `AudioManager`: Web Audio, decode all `audio/*.mp4` (AAC) into buffers at load (map by id), play via pooled `BufferSource`, per-channel volume + master mute.
- **Autoplay policy:** create/resume `AudioContext` on first user gesture (the "PLAY" / first key).
- SFX triggers: step (per-character bark), hit, drown, coin, train warn/pass, eagle, unlock.

### 5.11 UI
- **HUD** (DOM overlay, cheap + crisp): score (big 8-Bit-Wonder style number), money, character select button.
- **Screens:** Menu (start), Character Select, Game Over (score, high score, "play again"), Pause.
- Mobile: touch — tap a direction (or swipe) to step; on-screen hints.


---

## 6. Art & Assets

**Route A — Faithful reuse (fastest to "looks exactly like the original"):**
Pull the real assets straight from the host and reuse them:
- Base URL: `https://crossy-road-unblock.github.io/crossy-road/`
- Grab `sprites/*` (esp. `tiled-bg.png`, `interface.png`+`interface.json`, `chicken.png`, character PNGs, `particles.png`), `fonts/*` (8-Bit-Wonder atlas+JSON, EditUndoBrk `woff2`), `audio/*` (83 files), `plain-audio/splashintro.mp4`.
- You can automate this with a `curl` over the repo file list (API: `repos/.../git/trees/main?recursive=1`).
- ⚠️ **Legally gray** — it's the exact copyrighted art/SFX/name. Fine for a private/portfolio demo or a faithful test build; risky to publish as-is.

**Route B — Original art (safe to ship):**
- Keep the same *system of* assets: one world tileset, one atlas per character, one UI atlas, one font, ~30–40 SFX.
- Tileset: draw grass/road/river/rail in a matching low-poly cartoon style.
- Characters: 5–10 originals, each a small sprite sheet (4 facing directions × 1–2 frames + a death frame) or a low-poly model.
- Font: an open pixel font (e.g., "Pixelify"/"Press Start"-style) as a stand-in for 8-Bit-Wonder.
- SFX: record/generate equivalents (hop, car honk, splat, splash, coin, train whistle, eagle screech, unlock). Tools: FMOD/Freesound CC0, or synthesize.

**Suggested asset pipeline:** author as PNG sprite sheets → texture-pack; SFX as short AAC/MP3 (≤ 2s) for small payload; lazy-load audio until first gesture.

---

## 7. Reference Map (original file → clone module)
| Original | Clone counterpart |
|---|---|
| `three.min.js` | `three` npm package |
| `game.min.js` (2.7MB logic) | `systems/*` + `entities/*` + `world/*` |
| `asset-loader.min.js` | `main.ts` AssetLoader (fetch + decode + progress) |
| `tween.min.js` | `@tweenjs/tween.js` / `Juice.ts` |
| `poki-sdk.js` | optional leaderboard service (or none) |
| `sprites/tiled-bg.png` | ground tileset |
| `sprites/chicken.png` + `hipster/trex/whale` | `characters.ts` art |
| `sprites/interface.png` + `.json` | HUD/menu atlas |
| `fonts/8-bit-wonder.*`, `editundobrk.*` | UI font |
| `audio/*` (83) | `audio/sfx.ts` map |
| `Storage` (in bootstrap) | `Meta.ts` + localStorage |

---

## 8. Milestones (each shippable / testable)

**Status (2026-11-26):** ✅ M0 done · ✅ M1 done (roads + traffic + collision/death + restart) · ✅ M2 done (sky texture, camera shake, death particles, slow-mo) · ✅ M3 done (rivers + logs/turtles + riding + drowning) · ✅ M4 done (railroads + trains + telegraph) · ✅ M5 done (eagle + forward-pressure) · ✅ M6 done (coins, banking, character select, persistence) · ✅ M7 done (coin pops, hop dust, particles).

- **M0 — Scaffold (Day 1):** Vite+TS+Three.js; render a tiled grid, place the chicken mesh, basic camera + WASD step (no hazards). *Gate: move around a static field.*
- **M1 — Roads + Cars (Day 2–3):** `WorldGenerator` grass/road; car movers; car collision + death + restart. *Gate: die to a car; score by distance.*
- **M2 — Score/Distance/Camera (Day 3):** distance scoring, camera follow, game-over screen, high score. *Gate: full single-run loop.*
- **M3 — Rivers (Day 4):** water, logs, turtles; riding; drowning. *Gate: cross a river on a log.*
- **M4 — Railroads (Day 5):** train convoys + telegraph. *Gate: survive/die to a train.*
- **M5 — Eagle (Day 6):** telegraph + front-row grab. *Gate: get grabbed; can dodge.*
- **M6 — Money & Unlocks (Day 7):** coins, banking, character select, persistence. *Gate: unlock a 2nd character across runs.* ✅
- **M7 — Juice (Day 8):** particles, squash/stretch, screen shake, slow-mo death, per-char barks, full SFX. *Gate: feels "gamey".* ✅ (coin pops, hop dust, particles + existing shake/slow-mo/death particles)
- **M8 — UI/Polish (Day 9):** menu, game over, pause, mute, responsive layout, touch controls. *Gate: usable on phone.*
- **M9 — Perf + Tests (Day 10):** chunk GC, frame budget, unit tests green, 60fps on target device.
- **M10 (optional):** Leaderboard, more characters, golden/secret elements, asset Route A swap.

---

## 9. Testing Strategy
- **Unit (Vitest):** `RNG` determinism; `WorldGenerator` (row-type constraints, difficulty, seed reproducibility); `Scoring` (max-row invariant); `Collision` (each hazard, coin pickup); `Movement` (riding/blocking); `EagleLogic` (strike window/fairness); `Meta` (persistence + fallback).
- **Integration:** a scripted "run" against a fixed seed asserts expected deaths/scores (golden runs).
- **Manual/Playtest:** balance pass (lane weights, speeds), feel pass (step timing, camera).
- **Perf/CI:** assert draw calls + entity count under budget; Playwright loads page, runs a few frames, no console errors; visual snapshot of menu + a gameplay frame.

---

## 10. Performance Targets & Edge Cases
- **Budget:** ≥55fps on mid mobile, 60fps desktop; <8ms JS/frame; audio decode off the main thread during load; bounded entities (chunk culling).
- **Edge cases:** off-grid input; hazard overlap on same frame (pick most-severe); riding carried off-screen; train + car overlap; rapid input (buffering); far-down camera clamp; WebGL context loss (show retry); disabled localStorage (in-memory fallback); audio autoplay (gesture-gated); resize/rotation; devicePixelRatio scaling.

---

## 11. Controls
- **Keyboard:** Arrow keys / WASD = step; `P` pause; `M` mute; `R` restart.
- **Mouse:** click a direction arrow (or the field) to step.
- **Touch:** swipe in a direction / tap on-screen d-pad.

---

## 12. Risk Register
| Risk | Mitigation |
|---|---|
| Getting "feel" wrong (step timing, camera) | Put all feel params in `tuning.ts`; playtest early (M0–M2) |
| Isometric depth-sort artifacts | Sort by (row+col); test overlapping objects |
| Balance (too easy/hard) | Difficulty curve in config; seed replay to tune |
| Scope creep (40 chars, secrets) | MVP ships 5–8 chars; rest in M10 |
| IP (if publishing) | Use Route B + rename |
| WebGL context loss / mobile quirks | Context-loss handler; test on real device |

---

## 13. Definition of Done (MVP)
- Desktop + mobile playable; grass/road/rail/river; cars/trains/logs/eagle; distance score + coins + 1 unlock; death/game-over/restart; persistent money & high score; menu + HUD; 60fps; unit tests green for core systems; no console errors.



