import * as THREE from 'three';
import {
  ISLAND_RADIUS,
  ROCK_AIM_MIN_DOT,
  ROCK_COUNT,
  ROCK_GROW_SECONDS,
  ROCK_HITS,
  ROCK_RADIUS,
  ROCK_REACH,
  ROCK_REGROW_CLEARANCE,
  ROCK_REGROW_SECONDS,
  WORLD_SEED,
} from '../config';
import { createOreRock } from '../render/props';
import type { ColliderGrid } from '../world/Colliders';
import { mulberry32 } from '../world/noise';

/** The slice of World that ore rocks need (avoids a circular import). */
export interface RockHost {
  colliders: ColliderGrid;
  groundHeight(x: number, z: number): number;
  /** Forest ground a rock may sit on (dry, not desert, on the island). */
  isLand(x: number, z: number): boolean;
}

/**
 * mined  - depleted, hidden, waiting `timer` seconds to regrow.
 * growing - scaling back up to full size (has a collider, not mineable).
 * solid  - full size, mineable, has a collider.
 */
export type RockState = 'solid' | 'mined' | 'growing';

export interface Rock {
  x: number;
  y: number;
  z: number;
  yaw: number;
  state: RockState;
  /** Remaining hits before it is mined out. */
  hp: number;
  /** mined: seconds until regrow. growing: seconds grown so far. */
  timer: number;
  /** Seconds of hit-wobble remaining. */
  shake: number;
  /** Current collider id, or -1 when mined. */
  colliderId: number;
  group: THREE.Group;
}

const SHAKE_TIME = 0.3;

/**
 * Metal ore rocks scattered on forest ground (SPEC feature 7). Mined like trees
 * (see Interaction: a few hits with a tool, then it drops metal_ore), after
 * which the rock regrows in place so the island never runs out. Seeded like the
 * forest so the layout is deterministic. Structured like Chests (one Group per
 * rock) with Forest-style hit/regrow timers.
 */
export class Rocks {
  readonly group = new THREE.Group();
  readonly rocks: Rock[] = [];

  constructor(private readonly host: RockHost) {
    this.group.name = 'rocks';
    const seeded = mulberry32(WORLD_SEED + 400);
    for (let i = 0; i < ROCK_COUNT; i++) {
      const spot = this.findSpot(seeded);
      if (spot) this.spawn(spot.x, spot.z);
    }
  }

  /** Closest mineable rock in front of (x, z): within reach and aim cone. */
  findTarget(x: number, z: number, fx: number, fz: number): Rock | null {
    let best: Rock | null = null;
    let bestD = ROCK_REACH;
    for (const r of this.rocks) {
      if (r.state !== 'solid') continue;
      const dx = r.x - x;
      const dz = r.z - z;
      const d = Math.hypot(dx, dz);
      if (d > bestD) continue;
      if (d > 0.3 && (dx * fx + dz * fz) / d < ROCK_AIM_MIN_DOT) continue;
      bestD = d;
      best = r;
    }
    return best;
  }

  /** Register one mining hit of `power`. Returns true if this hit mined it out. */
  hit(rock: Rock, power: number): boolean {
    if (rock.state !== 'solid') return false;
    rock.hp -= power;
    rock.shake = SHAKE_TIME;
    if (rock.hp > 0) return false;
    rock.state = 'mined';
    rock.timer = ROCK_REGROW_SECONDS;
    rock.shake = 0;
    if (rock.colliderId >= 0) {
      this.host.colliders.remove(rock.colliderId);
      rock.colliderId = -1;
    }
    rock.group.visible = false;
    return true;
  }

  update(dt: number, px: number, pz: number): void {
    for (const r of this.rocks) {
      if (r.shake > 0) {
        r.shake = Math.max(0, r.shake - dt);
        const k = r.shake / SHAKE_TIME;
        r.group.position.x = r.x + Math.sin(r.shake * 60) * 0.04 * k;
      }
      if (r.state === 'mined') {
        r.timer -= dt;
        if (r.timer > 0) continue;
        if (Math.hypot(r.x - px, r.z - pz) < ROCK_REGROW_CLEARANCE) {
          r.timer = 3; // player standing on it; try again shortly
          continue;
        }
        r.state = 'growing';
        r.timer = 0;
        r.hp = ROCK_HITS;
        r.colliderId = this.host.colliders.add(r.x, r.z, ROCK_RADIUS).id;
        r.group.visible = true;
      } else if (r.state === 'growing') {
        r.timer += dt;
        const g = Math.min(1, r.timer / ROCK_GROW_SECONDS);
        r.group.scale.setScalar(Math.max(0.05, g));
        if (g >= 1) r.state = 'solid';
      }
    }
  }

  // ---- internals ----

  private findSpot(random: () => number): { x: number; z: number } | null {
    for (let i = 0; i < 40; i++) {
      const angle = random() * Math.PI * 2;
      const r = 14 + random() * (ISLAND_RADIUS - 30 - 14);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!this.host.isLand(x, z)) continue;
      if (this.host.colliders.overlaps(x, z, ROCK_RADIUS + 0.4)) continue;
      return { x, z };
    }
    return null;
  }

  private spawn(x: number, z: number): Rock {
    const y = this.host.groundHeight(x, z);
    const yaw = Math.random() * Math.PI * 2;
    const g = createOreRock();
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    this.group.add(g);
    const colliderId = this.host.colliders.add(x, z, ROCK_RADIUS).id;
    const rock: Rock = { x, y, z, yaw, state: 'solid', hp: ROCK_HITS, timer: 0, shake: 0, colliderId, group: g };
    this.rocks.push(rock);
    return rock;
  }
}
