# XRoads

A browser **Crossy Road** clone (Route A — faithful to the original), built with
**Vite + TypeScript + Three.js**.

The original web build and all of its assets live in [`assets/`](./assets) (copied
from `crossy-road-unblock.github.io`). This project points at those assets via the
Vite `publicDir`, so runtime URLs match the original layout (`/sprites/chicken.png`,
`/audio/...`, `/fonts/...`).

## Run

```bash
npm install
npm run dev      # -> http://localhost:5173
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build
```

## Status: M0 (done)

Working render, verified in a real browser:
- Isometric follow-camera, three.js scene (lights + fog).
- Tiled grid with lane types (grass / road / river / rail), chunk-culled.
- Real **chicken** sprite loaded from `assets/sprites/chicken.png`.
- Discrete step movement (WASD / Arrows) with a hop tween.
- Distance scoring (max northward row) shown in the HUD.

Move: **WASD / Arrow keys** (hold to walk).

## Structure

`src/` mirrors the plan (see [`crossy-road-clone-plan.md`](./crossy-road-clone-plan.md)):
`core/` (game loop, input, RNG, asset loader), `world/` (grid, lanes, generator, chunks),
`entities/` (player + movers), `systems/` (movement, scoring, traffic, collision, eagle, meta, juice),
`render/` (scene, camera, mesh factory, particles), `audio/`, `data/` (tuning/config), `ui/`.

Unimplemented modules are in place as typed stubs so the architecture is fixed and the
milestones (M1+) drop in cleanly.

## Roadmap

- **M1** roads + cars (traffic + collision + death)
- **M2** camera polish, game-over, high score
- **M3** rivers (logs/turtles, riding, drowning)
- **M4** railroads (train convoys)
- **M5** eagle
- **M6** coins + character unlocks + persistence
- **M7** juice (particles, squash, screen shake, SFX)
- **M8** menu / game-over / character-select UI, mobile touch
- **M9** perf + tests
