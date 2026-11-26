import { Game } from './core/Game';
import { AssetLoader } from './core/AssetLoader';
import { Hud } from './ui/Hud';
import { CHARACTERS, DEFAULT_CHARACTER } from './data/characters';

const BASE = import.meta.env.BASE_URL

async function boot() {
  const hud = new Hud();
  hud.showLoading('Loading…');
  const container = document.getElementById('game');
  if (!container) throw new Error('#game container missing');

  // Load all character textures so the select screen can show them, plus the sky.
  const loader = new AssetLoader();
  const textures = await loader.load([
    ...CHARACTERS.map((c) => ({ id: c.id, url: c.texture })),
    { id: 'sky', url: BASE + '/sprites/tiled-bg.png' },
  ]);
  hud.hideLoading();

  const { Meta } = await import('./systems/Meta');
  const meta = new Meta();

  let selectedId = localStorage.getItem('xr.selected') || DEFAULT_CHARACTER;
  if (!CHARACTERS.find((c) => c.id === selectedId)) selectedId = DEFAULT_CHARACTER;

  let game: Game | null = null;

  function startGame(charId: string) {
    const charDef = CHARACTERS.find((c) => c.id === charId)!;
    hud.hideCharacterSelect();
    game = new Game({
      container: container!,
      textures,
      sky: textures['sky']!,
      hud,
      character: charDef,
      money: meta.money,
    });
    game.start();
    (window as unknown as { __xroads: unknown }).__xroads = game;
  }

  function showCharacterSelect() {
    hud.showCharacterSelect(
      CHARACTERS,
      meta.unlocked,
      meta.money,
      (id) => {
        selectedId = id;
        localStorage.setItem('xr.selected', id);
        startGame(id);
      },
      (id) => {
        if (meta.unlock(id)) {
          selectedId = id;
          localStorage.setItem('xr.selected', id);
        }
      },
      () => {
        startGame(selectedId);
      },
    );
  }

  // Show character select on first launch.
  const hasPlayedBefore = localStorage.getItem('xr.played');
  if (!hasPlayedBefore) {
    localStorage.setItem('xr.played', '1');
    showCharacterSelect();
  } else {
    startGame(selectedId);
  }
}

boot().catch((err) => {
  const el = document.getElementById('loading');
  if (el) el.textContent = 'Failed to load: ' + (err?.message || String(err));
});
