import * as THREE from 'three';
import { CAMPFIRE_GROUND_HEIGHT, CAMPFIRE_OUT_GRACE_SECONDS } from '../config';
import { Inventory } from '../inventory/Inventory';
import { Interaction } from '../player/Interaction';
import { Player } from '../player/Player';
import { PlayerStats, type DamageSource } from '../player/Stats';
import { GameOver } from '../ui/GameOver';
import { Hud } from '../ui/Hud';
import { PixelRenderer } from '../render/PixelRenderer';
import { Overlay } from '../ui/Overlay';
import { World } from '../world/World';
import { history } from './History';
import { Input } from './Input';

/**
 * Where the game is:
 *  - menu:     before the first run starts (start overlay)
 *  - playing:  simulation running, pointer locked
 *  - paused:   pointer lock lost / Esc (pause overlay)
 *  - gameover: player died (game-over screen)
 *  - home:     after "Save progress" on the game-over screen (start overlay, "New game")
 */
type State = 'menu' | 'playing' | 'paused' | 'gameover' | 'home';

/**
 * Top-level orchestrator: renderer, main loop, run lifecycle.
 *
 * A "run" is one attempt: World + Player + Inventory + Stats + Interaction.
 * `newRun()` throws the old one away and builds a fresh one, so any new
 * per-run system must be created there (and anything it owns that touches the
 * GPU must be inside `world.scene`, which is disposed on reset).
 * Systems update in a fixed order each frame (see `tick()`), only while playing.
 */
export class Game {
  private readonly renderer: PixelRenderer;
  private readonly input: Input;
  private readonly overlay: Overlay;
  private readonly gameOver: GameOver;
  private readonly hud = new Hud();
  private readonly clock = new THREE.Clock();
  private state: State = 'menu';

  // Per-run objects, recreated by newRun().
  private world!: World;
  private player!: Player;
  private inventory!: Inventory;
  private stats!: PlayerStats;
  private interaction!: Interaction;

  constructor(container: HTMLElement) {
    this.renderer = new PixelRenderer(container);
    this.input = new Input(this.renderer.domElement);

    this.overlay = new Overlay(() => this.onOverlayClick());
    this.gameOver = new GameOver(
      () => this.restart(),
      () => this.saveAndGoHome(),
    );
    this.newRun();
    this.overlay.show('Click to play');

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.renderer.domElement && this.state === 'playing') this.pause();
    });
    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.player.resize(window.innerWidth / window.innerHeight);
    });
  }

  start(): void {
    this.renderer.renderer.setAnimationLoop(() => this.tick());
  }

  // ---- run lifecycle ----

  /** Build a brand-new world and player, discarding the previous run. */
  private newRun(): void {
    if (this.world) disposeScene(this.world.scene);

    this.world = new World();
    this.inventory = new Inventory();
    this.stats = new PlayerStats();
    // Spawn just south of the fire, looking at it (camera looks down -Z at yaw 0).
    this.player = new Player(
      window.innerWidth / window.innerHeight,
      new THREE.Vector3(0, CAMPFIRE_GROUND_HEIGHT, 5),
    );
    this.world.scene.add(this.player.body, this.player.camera); // camera is in the scene so its held-item view model renders
    this.inventory.add('wooden_axe', 1); // starting gear
    this.inventory.select(0);
    this.hud.bind(this.inventory);
    this.interaction = new Interaction(this.player, this.world, this.inventory, this.hud, this.stats);

    const fire = this.world.campfire;
    fire.onLevelUp = (level) =>
      this.hud.toast(`Campfire reached level ${level}! More of the island is open to explore.`, 5000);
    fire.onLowFuel = () => this.hud.toast('The campfire is running low. Add logs!', 4000);
    fire.onExtinguished = () => this.hud.toast('The campfire went out! Relight it within 10 seconds.', 6000);
    fire.onSafeZoneLost = () => this.hud.toast('The safe zone is gone. Add a log to relight the fire!', 6000);
    this.stats.onDeath = (cause) => this.onDeath(cause);

    // Dev console handle: __stranded.stats.damage(30), .inventory.add('log', 50), etc.
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__stranded = {
        world: this.world,
        player: this.player,
        stats: this.stats,
        inventory: this.inventory,
      };
    }

    // Dev shortcut: ?hour=22 starts at 10pm, to eyeball the night look.
    const hour = Number(new URLSearchParams(location.search).get('hour'));
    if (hour) this.world.dayNight.setHour(hour);
    this.updateHudInfo();
  }

  private onOverlayClick(): void {
    if (this.state === 'home') this.newRun(); // "New game" after saving
    this.resume();
  }

  private resume(): void {
    this.renderer.domElement.requestPointerLock();
    this.state = 'playing';
    this.input.clear();
    this.clock.getDelta(); // discard time spent paused
    this.overlay.hide();
  }

  private pause(): void {
    this.state = 'paused';
    this.input.clear();
    this.overlay.show('Click to resume');
  }

  private onDeath(cause: DamageSource): void {
    this.state = 'gameover';
    this.input.clear();
    if (document.pointerLockElement) document.exitPointerLock();
    // Recorded immediately so closing the tab on this screen never loses the run.
    const run = {
      endedAt: new Date().toISOString(),
      nights: this.world.dayNight.nightsSurvived,
      day: this.world.dayNight.day,
      cause,
    };
    const newBest = history.record(run);
    this.hud.setPrompt(null);
    this.updateHudInfo(); // final health/hunger values behind the game-over box
    this.gameOver.show(run, history.bestStreak, newBest);
  }

  /** Game-over button: start a fresh run immediately. */
  private restart(): void {
    this.gameOver.hide();
    this.newRun();
    this.resume();
  }

  /** Game-over button: keep the result and return to the home screen. */
  private saveAndGoHome(): void {
    this.gameOver.hide();
    this.state = 'home';
    this.overlay.show('New game');
  }

  // ---- per-frame ----

  private updateHudInfo(): void {
    const { dayNight, campfire } = this.world;
    const h = Math.floor(dayNight.hour);
    const m = Math.floor((dayNight.hour - h) * 60);
    const clock = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    let fire: string;
    if (campfire.lit) {
      const f = Math.ceil(campfire.fuel);
      fire = `fuel ${Math.floor(f / 60)}:${String(f % 60).padStart(2, '0')}`;
    } else if (campfire.safeZoneActive) {
      fire = `OUT! safe zone lost in ${Math.ceil(CAMPFIRE_OUT_GRACE_SECONDS - campfire.outSeconds)}s`;
    } else {
      fire = 'OUT! no safe zone';
    }
    this.hud.setInfo(
      `Day ${dayNight.day}  ${clock}  |  Nights survived ${dayNight.nightsSurvived}  |  Campfire Lv ${campfire.level}: ${campfire.logs}/${campfire.logsRequired} logs, ${fire}`,
    );
    this.hud.setStats(this.stats);
  }

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.state === 'playing') {
      this.player.starving = this.stats.isStarving;
      this.player.update(dt, this.input, this.world);
      this.stats.update(dt, this.player.isSprinting);
      this.interaction.update(dt, this.input);
      this.world.update(dt, this.player.position);
      this.updateHudInfo();
      this.hud.setCrosshair(this.player.isFirstPerson);
    }
    this.input.endFrame();
    this.renderer.render(this.world.scene, this.player.camera);
  }
}

/** Free GPU resources of everything in a scene (used when a run is discarded). */
function disposeScene(scene: THREE.Scene): void {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh && !(obj as THREE.InstancedMesh).isInstancedMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => m?.dispose());
    (obj as THREE.InstancedMesh).dispose?.();
  });
}
