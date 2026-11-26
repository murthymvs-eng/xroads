import * as THREE from 'three';
import { SceneManager } from '../render/SceneManager';
import { CameraRig } from '../render/Camera';
import { MeshFactory } from '../render/MeshFactory';
import { ChunkManager } from '../world/ChunkManager';
import { WorldGenerator } from '../world/WorldGenerator';
import { Grid } from '../world/Grid';
import { Player } from '../entities/Player';
import { Movement } from '../systems/Movement';
import { Traffic } from '../systems/Traffic';
import { Water } from '../entities/FloatingObject';
import { Rail } from '../entities/Train';
import { EagleSystem } from '../entities/Eagle';
import { CoinSystem } from '../entities/Coin';
import { Collision } from '../systems/Collision';
import { Scoring } from '../systems/Scoring';
import { Meta } from '../systems/Meta';
import { Particles } from '../render/Particles';
import { Hud } from '../ui/Hud';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { GameState } from './GameState';
import { DEATH } from '../data/tuning';
import type { CharacterDef } from '../data/characters';

export interface GameDeps {
  container: HTMLElement;
  textures: Record<string, THREE.Texture>;
  sky?: THREE.Texture;
  hud: Hud;
  character: CharacterDef;
  money?: number;
  selectedCharacter?: CharacterDef;
}

export class Game {
  private sceneMgr: SceneManager;
  private rig: CameraRig;
  private grid = new Grid();
  private generator: WorldGenerator;
  private chunks: ChunkManager;
  private traffic: Traffic;
  private water: Water;
  private rail: Rail;
  private eagle: EagleSystem;
  private coins: CoinSystem;
  private collision = new Collision();
  private runMoney = 0;
  private player: Player;
  private movement: Movement;
  private scoring: Scoring;
  private meta = new Meta();
  private particles: Particles;
  private loop: GameLoop;
  private input = new Input();
  private hud: Hud;
  private state: GameState = GameState.Playing;
  private dieT = 0;
  private timeScale = 1;
  private seed: number;
  private prevIsMoving = false;

  constructor(deps: GameDeps) {
    const { container, textures, hud, character, sky, money, selectedCharacter } = deps;
    this.hud = hud;
    this.sceneMgr = new SceneManager(container);
    this.rig = new CameraRig(this.sceneMgr.camera);
    if (sky) this.sceneMgr.setBackground(sky);

    // Use the selected character if provided (from character select), otherwise default.
    const activeChar = selectedCharacter ?? character;
    const activeTex = textures[activeChar.id] ?? Object.values(textures)[0];

    this.seed = (Math.random() * 0xffffffff) >>> 0;
    this.generator = new WorldGenerator(this.seed);
    const factory = new MeshFactory();
    this.traffic = new Traffic(this.sceneMgr.scene, factory);
    this.traffic.setSeed(this.seed);
    this.water = new Water(this.sceneMgr.scene, factory);
    this.water.setSeed(this.seed);
    this.rail = new Rail(this.sceneMgr.scene, factory);
    this.rail.setSeed(this.seed);
    this.eagle = new EagleSystem(this.sceneMgr.scene, factory);
    this.coins = new CoinSystem(this.sceneMgr.scene, factory);
    this.coins.setSeed(this.seed);

    this.player = new Player(activeChar, activeTex);
    this.sceneMgr.scene.add(this.player.sprite);

    // Initialize money display from Meta (persisted across runs).
    this.hud.setMoney(this.meta.money);
    if (money !== undefined) this.hud.setMoney(money);

    this.particles = new Particles(this.sceneMgr.scene);
    this.chunks = new ChunkManager(this.sceneMgr.scene, this.generator, this.grid, factory);
    this.movement = new Movement(this.player, this.grid, this.input);
    this.scoring = new Scoring(this.player);
    this.loop = new GameLoop((dt) => this.update(dt));

    window.addEventListener('resize', () => this.resize());
    document
      .getElementById('restart')
      ?.addEventListener('click', () => {
        if (this.state === GameState.GameOver) this.restart();
      });

    this.resize();
    this.chunks.sync(this.player.row);
    this.traffic.sync(this.player.row, this.generator);
  }

  start(): void {
    this.input.attach();
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.input.detach();
  }

  private resize(): void {
    this.sceneMgr.resize(window.innerWidth, window.innerHeight);
  }

  private update(dt: number): void {
    const effDt = dt * this.timeScale;

    if (this.state === GameState.Playing) {
      this.movement.update(effDt);
      this.traffic.update(effDt);
      this.water.update(effDt);
      this.water.updateRiding(this.player);
      this.rail.update(effDt);
      this.scoring.update();
      this.chunks.sync(this.player.row);
      this.traffic.sync(this.player.row, this.generator);
      this.water.sync(this.player.row, this.generator);
      this.rail.sync(this.player.row, this.generator);
      if (this.collision.check(this.player, this.traffic)) this.startDeath();
      if (this.water.checkDrown(this.player, this.generator)) this.startDeath();
      if (this.collision.checkTrain(this.player, this.rail)) this.startDeath();
      if (this.eagle.tick(effDt, this.player)) this.startDeath();
      this.coins.sync(this.player.row, this.generator);
      const coinValue = this.coins.collectAt(this.player.col, this.player.row);
      if (coinValue > 0) {
        this.runMoney += coinValue;
        this.meta.bank(coinValue);
        this.hud.setMoney(this.meta.money);
        // Coin pop particles (gold burst).
        this.particles.burst(
          this.player.world.x,
          this.player.world.y + 0.4,
          this.player.world.z,
          8,
          0xffd700,
        );
      }

      // Hop dust when a step completes.
      if (this.prevIsMoving && !this.player.isMoving) {
        this.particles.burst(
          this.player.world.x,
          this.player.world.y + 0.1,
          this.player.world.z,
          6,
          0x8a8a8a,
        );
      }
      this.prevIsMoving = this.player.isMoving;
      this.particles.update(effDt);
    } else if (this.state === GameState.Dying) {
      this.dieT += effDt;
      // Slow-mo: ramp time scale down to ~15% over the death animation.
      this.timeScale = 1 - (this.dieT / DEATH.freeze) * 0.85;
      this.player.scaleCharacter(Math.max(0, 1 - this.dieT / DEATH.squish));
      this.particles.update(effDt);
      if (this.dieT >= DEATH.freeze) this.finishDeath();
    } else if (this.state === GameState.GameOver) {
      this.particles.update(effDt);
      if (this.input.consumeRestart()) this.restart();
    }

    this.rig.update(this.player.world);
    this.hud.setDistance(this.scoring.distance);
    this.sceneMgr.render();
  }

  private startDeath(): void {
    this.state = GameState.Dying;
    this.dieT = 0;
    this.timeScale = 1;
    // Death juice: screen shake + death particles at the player.
    this.rig.shakeCamera(0.35, 0.35);
    this.particles.burst(
      this.player.world.x,
      this.player.world.y,
      this.player.world.z,
      24,
      0x4f8fd9,
    );
  }

  private finishDeath(): void {
    this.state = GameState.GameOver;
    this.timeScale = 1;
    this.input.clear();
    this.meta.newHigh(this.scoring.distance);
    this.hud.showGameOver(this.scoring.distance, this.meta.highScore);
  }

  // Fresh run: new world seed, reset player/score/traffic, back to Playing.
  private restart(): void {
    this.seed = (Math.random() * 0xffffffff) >>> 0;
    this.generator.reset(this.seed);
    this.traffic.reset();
    this.traffic.setSeed(this.seed);
    this.water.reset();
    this.water.setSeed(this.seed);
    this.rail.reset();
    this.rail.setSeed(this.seed);
    this.eagle.reset();
    this.coins.reset();
    this.chunks.reset();
    this.scoring.reset();
    this.player.reset();
    this.dieT = 0;
    this.input.clear();
    this.state = GameState.Playing;
    this.hud.clearGameOver();
    this.chunks.sync(this.player.row);
    this.traffic.sync(this.player.row, this.generator);
  }

  // Change the active character mid-session (used by character select).
  setCharacter(character: CharacterDef, textures: Record<string, THREE.Texture>): void {
    const tex = textures[character.id] ?? Object.values(textures)[0];
    this.player = new Player(character, tex);
    this.sceneMgr.scene.add(this.player.sprite);
    this.chunks.sync(this.player.row);
    this.traffic.sync(this.player.row, this.generator);
    this.water.sync(this.player.row, this.generator);
    this.rail.sync(this.player.row, this.generator);
  }
}