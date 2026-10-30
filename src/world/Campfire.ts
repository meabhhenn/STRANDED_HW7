import * as THREE from 'three';
import {
  CAMPFIRE_LOG_BURN_SECONDS,
  CAMPFIRE_LOW_FUEL_SECONDS,
  CAMPFIRE_MAX_FUEL_SECONDS,
  CAMPFIRE_OUT_GRACE_SECONDS,
  CAMPFIRE_START_FUEL_SECONDS,
  COOK_CAPACITY,
  COOK_SECONDS,
  logsRequiredForLevel,
} from '../config';
import { ITEMS } from '../inventory/Item';
import { faceted, toon } from '../render/materials';
import { createLog } from '../render/props';

/**
 * Campfire: stone ring, logs, flame and a flickering light.
 *
 * Two separate systems are driven by the same logs:
 *  - Levelling: each log counts toward `logsRequired`; when reached the fire
 *    levels up and the counter resets. `World.campfireLevel` reads `level`.
 *  - Fuel: each log adds burn time; fuel drains in real time. At 0 the fire
 *    goes out; after CAMPFIRE_OUT_GRACE_SECONDS the safe zone is lost until the
 *    fire is relit by adding any log. (SPEC rule 1.)
 *
 * Cooking: raw meat dropped into a lit fire (`cook()`) takes COOK_SECONDS and
 * then `onCooked(count)` fires so the world can drop the cooked meat. The
 * timer only runs while the fire is lit.
 *
 * Not implemented yet (see docs/ROADMAP.md): enemies reacting to the safe zone
 * (use `World.isSafe()`).
 */
export class Campfire {
  readonly group = new THREE.Group();
  /** Radius of the solid base (used for player collision). */
  readonly collisionRadius = 1.0;
  /** True while fuel remains. */
  lit = true;
  /** Seconds of burn time left. */
  fuel = CAMPFIRE_START_FUEL_SECONDS;
  /** Seconds the fire has been out (resets when relit). */
  outSeconds = 0;
  /** False once the fire has been out longer than the grace period. */
  safeZoneActive = true;
  level = 1;
  /** Logs added toward the current level. */
  logs = 0;
  /** Called after the fire levels up, with the new level. */
  onLevelUp?: (level: number) => void;
  /** Fuel just ran out (grace period starts). */
  onExtinguished?: () => void;
  /** Out for too long: safe zone just disappeared. */
  onSafeZoneLost?: () => void;
  /** Fuel dropped below the warning threshold (fires once per refuel). */
  onLowFuel?: () => void;
  /** Called when a batch finishes cooking, with the number of pieces. */
  onCooked?: (count: number) => void;
  private lowFuelWarned = false;
  private readonly cooking: { count: number; timer: number; mesh: THREE.Object3D }[] = [];

  private readonly cookGroup = new THREE.Group();
  private readonly flame: THREE.Mesh;
  private readonly light: THREE.PointLight;
  private time = 0;

  constructor(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
    this.group.name = 'campfire';

    const stone = toon(0x9aa0a6);
    const stoneDark = toon(0x6e747a);
    const rockGeo = faceted(new THREE.DodecahedronGeometry(0.3, 0));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rock = new THREE.Mesh(rockGeo, i % 2 ? stone : stoneDark);
      rock.position.set(Math.cos(a) * 0.85, 0.16, Math.sin(a) * 0.85);
      rock.rotation.set(a, a * 2, 0);
      rock.scale.set(1, 0.8, 1);
      this.group.add(rock);
    }

    // Four cut logs leaning around the fire, with visible ring-pattern ends.
    for (let i = 0; i < 4; i++) {
      const log = createLog();
      log.rotation.y = (i / 4) * Math.PI + 0.4;
      log.position.y = 0.17 + (i % 2) * 0.17;
      this.group.add(log);
    }

    // Two nested flame cones: red-orange outside, yellow core. Unlit so they glow.
    this.flame = new THREE.Mesh(faceted(new THREE.ConeGeometry(0.42, 1.1, 6)), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    this.flame.position.y = 0.75;
    const core = new THREE.Mesh(faceted(new THREE.ConeGeometry(0.24, 0.8, 6)), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    core.position.y = -0.1;
    this.flame.add(core);
    this.group.add(this.flame);

    this.group.add(this.cookGroup);

    this.light = new THREE.PointLight(0xff9a40, 25, 28, 1.6);
    this.light.position.y = 1.2;
    this.group.add(this.light);
  }

  /** Pieces of meat currently cooking. */
  get cookingCount(): number {
    return this.cooking.reduce((n, c) => n + c.count, 0);
  }

  /**
   * Put raw meat in the fire. Returns how many pieces were accepted (0 if the
   * fire is out or full); the caller keeps the rest.
   */
  cook(count: number): number {
    if (!this.lit) return 0;
    const accepted = Math.max(0, Math.min(count, COOK_CAPACITY - this.cookingCount));
    if (accepted === 0) return 0;
    const mesh = ITEMS.raw_meat.createMesh(accepted);
    const a = Math.random() * Math.PI * 2;
    mesh.position.set(Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3);
    this.cookGroup.add(mesh);
    this.cooking.push({ count: accepted, timer: COOK_SECONDS, mesh });
    return accepted;
  }

  private cookTick(dt: number): void {
    if (!this.lit) return;
    for (let i = this.cooking.length - 1; i >= 0; i--) {
      const c = this.cooking[i];
      c.timer -= dt;
      if (c.timer > 0) continue;
      this.cookGroup.remove(c.mesh);
      this.cooking.splice(i, 1);
      this.onCooked?.(c.count);
    }
  }

  /** Logs needed to finish the current level. */
  get logsRequired(): number {
    return logsRequiredForLevel(this.level);
  }

  /**
   * Feed one log: adds burn time (relighting the fire if needed) and counts
   * toward the level. Returns true if this log caused a level-up.
   */
  addLog(): boolean {
    this.fuel = Math.min(CAMPFIRE_MAX_FUEL_SECONDS, this.fuel + CAMPFIRE_LOG_BURN_SECONDS);
    this.lit = true;
    this.outSeconds = 0;
    this.safeZoneActive = true;
    if (this.fuel > CAMPFIRE_LOW_FUEL_SECONDS) this.lowFuelWarned = false;
    this.logs++;
    if (this.logs < this.logsRequired) return false;
    this.logs = 0;
    this.level++;
    // Bigger flame and light reach with level (capped so it stays readable).
    const grow = Math.min(this.level, 20);
    this.group.scale.setScalar(1 + grow * 0.02);
    this.light.distance = 28 + grow * 2;
    this.onLevelUp?.(this.level);
    return true;
  }

  update(dt: number): void {
    this.time += dt;
    this.burn(dt);
    this.cookTick(dt);
    this.flame.visible = this.lit;
    if (!this.lit) {
      this.light.intensity = 0;
      return;
    }
    // Flame shrinks and dims as fuel runs low.
    const vigor = 0.4 + 0.6 * Math.min(1, this.fuel / CAMPFIRE_LOW_FUEL_SECONDS);
    const flicker = (1 + Math.sin(this.time * 17) * 0.06 + Math.sin(this.time * 31.7) * 0.05) * vigor;
    this.flame.scale.set(1, flicker, 1);
    this.light.intensity = 25 * flicker;
  }

  private burn(dt: number): void {
    if (this.lit) {
      this.fuel = Math.max(0, this.fuel - dt);
      if (this.fuel <= CAMPFIRE_LOW_FUEL_SECONDS && !this.lowFuelWarned && this.fuel > 0) {
        this.lowFuelWarned = true;
        this.onLowFuel?.();
      }
      if (this.fuel <= 0) {
        this.lit = false;
        this.outSeconds = 0;
        this.onExtinguished?.();
      }
    } else if (this.safeZoneActive) {
      this.outSeconds += dt;
      if (this.outSeconds >= CAMPFIRE_OUT_GRACE_SECONDS) {
        this.safeZoneActive = false;
        this.onSafeZoneLost?.();
      }
    }
  }
}
