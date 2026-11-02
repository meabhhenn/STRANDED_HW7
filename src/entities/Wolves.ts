import * as THREE from 'three';
import {
  ISLAND_RADIUS,
  WOLF_ATTACK_COOLDOWN,
  WOLF_ATTACK_DAMAGE,
  WOLF_ATTACK_RANGE,
  WOLF_CHASE_SPEED,
  WOLF_COUNT,
  WOLF_DEATH_TIME,
  WOLF_DEFEND_RANGE,
  WOLF_FOLLOW_DISTANCE,
  WOLF_FOLLOW_SPEED,
  WOLF_HP,
  WOLF_HUNT_RANGE,
  WOLF_HURT_TIME,
  WOLF_LEASH_DISTANCE,
  WOLF_TAME_MEAT,
  WOLF_WANDER_SPEED,
  WORLD_SEED,
} from '../config';
import type { ColliderGrid } from '../world/Colliders';
import type { DroppedItems } from '../world/DroppedItems';
import { mulberry32 } from '../world/noise';
import type { Animal, Livestock } from './Livestock';
import type { Monster, Monsters } from './Monsters';
import { WOLVES, createWolfModel, type WolfKind } from './wolfKinds';

/** The slice of World that wolves need (avoids a circular import). */
export interface WolfHost {
  colliders: ColliderGrid;
  drops: DroppedItems;
  groundHeight(x: number, z: number): number;
  /** Forest ground a wolf may stand on (dry, not desert, on the island). */
  isLand(x: number, z: number): boolean;
  /** True only during the in-game night (tamed wolves defend at night). */
  isNight(): boolean;
  /** World position of the campfire (where day-hunt meat is delivered). */
  firePos(): { x: number; z: number };
  /** Sibling entities the wolf fights (monsters) or hunts (livestock). */
  monsters: Monsters;
  livestock: Livestock;
}

type WolfState = 'idle' | 'wander' | 'chase' | 'follow' | 'flee' | 'dead';

export interface Wolf {
  kind: WolfKind;
  hp: number;
  x: number;
  y: number;
  z: number;
  /** Heading: forward = (-sin yaw, -cos yaw), same as the player. */
  yaw: number;
  state: WolfState;
  /** Seconds left in the current state (death: seconds since death). */
  timer: number;
  /** Seconds of hit squash animation left. */
  hurt: number;
  /** Seconds until this wolf may attack again. */
  attackCooldown: number;
  /** True once tamed; tamed wolves follow and defend the player. */
  tamed: boolean;
  /** Raw-meat feedings so far (tames at WOLF_TAME_MEAT). */
  fed: number;
  /** Current prey/threat it is chasing (monster or animal), if any. */
  prey: Monster | Animal | null;
  group: THREE.Group;
  legs: THREE.Object3D[];
  swingPhase: number;
  swingAmp: number;
  visualYaw: number;
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

/**
 * Wolves (SPEC feature 4). Wild wolves wander the forest and ignore the player
 * unless hit. Feeding a wild wolf raw meat (see Interaction) tames it after
 * WOLF_TAME_MEAT feedings. Tamed wolves follow the player; at night they attack
 * monsters near the player or the campfire, and by day they hunt nearby
 * livestock and the meat is delivered to the campfire. Mirrors the
 * Livestock/Monsters pattern (data/model in wolfKinds.ts, behaviour here).
 */
export class Wolves {
  readonly group = new THREE.Group();
  readonly wolves: Wolf[] = [];

  constructor(private readonly host: WolfHost) {
    this.group.name = 'wolves';
    const seeded = mulberry32(WORLD_SEED + 500);
    for (let i = 0; i < WOLF_COUNT; i++) {
      const spot = this.findSpawnSpot(seeded);
      if (spot) this.spawn('wolf', spot.x, spot.z);
    }
  }

  /** Best living wolf in front of (x, z): within reach and aim cone, closest first. */
  findTarget(x: number, z: number, fx: number, fz: number, reach: number, minDot: number): Wolf | null {
    let best: Wolf | null = null;
    let bestD = reach;
    for (const w of this.wolves) {
      if (w.state === 'dead') continue;
      const dx = w.x - x;
      const dz = w.z - z;
      const d = Math.hypot(dx, dz) - WOLVES[w.kind].radius * 0.5;
      if (d > bestD) continue;
      if (d > 0.3 && (dx * fx + dz * fz) / Math.hypot(dx, dz) < minDot) continue;
      bestD = d;
      best = w;
    }
    return best;
  }

  /**
   * Feed a wild wolf raw meat. Returns true once this feeding tames it (so the
   * caller can toast). A tamed wolf ignores further feeding.
   */
  feed(wolf: Wolf): boolean {
    if (wolf.tamed || wolf.state === 'dead') return false;
    wolf.fed++;
    wolf.hurt = WOLF_HURT_TIME; // little happy wiggle reuses the squash anim
    if (wolf.fed >= WOLF_TAME_MEAT) {
      wolf.tamed = true;
      return true;
    }
    return false;
  }

  /**
   * Hit a wolf (the player can still attack one). It flees for a moment. On
   * death it plays the death animation and is removed. Returns true if killed.
   */
  hit(wolf: Wolf, damage: number, fromX: number, fromZ: number): boolean {
    if (wolf.state === 'dead') return false;
    wolf.hp -= damage;
    wolf.hurt = WOLF_HURT_TIME;
    if (wolf.hp <= 0) {
      wolf.state = 'dead';
      wolf.timer = 0;
      return true;
    }
    // Wild wolves flee when struck; tamed ones shrug it off and keep following.
    if (!wolf.tamed) {
      wolf.state = 'flee';
      wolf.timer = 3;
      wolf.yaw = Math.atan2(-(wolf.x - fromX), -(wolf.z - fromZ)) + rand(-0.4, 0.4);
    }
    return false;
  }

  update(dt: number, px: number, pz: number): void {
    for (let i = this.wolves.length - 1; i >= 0; i--) {
      const w = this.wolves[i];
      if (w.state === 'dead') {
        w.timer += dt;
        w.group.rotation.z = Math.min(1, w.timer / (WOLF_DEATH_TIME * 0.6)) * (Math.PI / 2);
        if (w.timer >= WOLF_DEATH_TIME) {
          this.group.remove(w.group);
          this.wolves.splice(i, 1);
        }
        continue;
      }
      if (w.tamed) this.thinkTamed(w, dt, px, pz);
      else this.thinkWild(w, dt);
      this.animate(w, dt);
    }
  }

  // ---- behaviour: wild ----

  private thinkWild(w: Wolf, dt: number): void {
    w.timer -= dt;
    switch (w.state) {
      case 'flee':
        if (!this.step(w, WOLF_CHASE_SPEED, dt)) w.yaw += Math.PI * rand(0.5, 1.5);
        if (w.timer <= 0) {
          w.state = 'idle';
          w.timer = rand(1, 3);
        }
        break;
      case 'wander':
        if (w.timer <= 0 || !this.step(w, WOLF_WANDER_SPEED, dt)) {
          w.state = 'idle';
          w.timer = rand(2, 5);
        }
        break;
      default: // idle
        if (w.timer <= 0) {
          w.state = 'wander';
          w.timer = rand(2, 4);
          w.yaw = Math.random() * Math.PI * 2;
        }
    }
    const moving = w.state === 'wander' || w.state === 'flee';
    w.swingAmp += ((moving ? (w.state === 'flee' ? 0.9 : 0.5) : 0) - w.swingAmp) * Math.min(1, dt * 8);
    w.swingPhase += dt * (w.state === 'flee' ? 16 : 8);
  }

  // ---- behaviour: tamed ----

  private thinkTamed(w: Wolf, dt: number, px: number, pz: number): void {
    w.attackCooldown = Math.max(0, w.attackCooldown - dt);

    // Pick a target: monsters near the player/fire at night, livestock by day.
    if (!w.prey || !this.preyAlive(w.prey)) w.prey = this.findPrey(w, px, pz);

    if (w.prey) {
      const tx = this.preyX(w.prey);
      const tz = this.preyZ(w.prey);
      const d = Math.hypot(tx - w.x, tz - w.z);
      w.state = 'chase';
      w.yaw = Math.atan2(-(tx - w.x), -(tz - w.z));
      // Give up if the prey wandered too far from the player (stay near home).
      if (Math.hypot(tx - px, tz - pz) > Math.max(WOLF_DEFEND_RANGE, WOLF_HUNT_RANGE) + 6) {
        w.prey = null;
      } else if (d > WOLF_ATTACK_RANGE) {
        this.step(w, WOLF_CHASE_SPEED, dt);
      } else if (w.attackCooldown <= 0) {
        this.biteprey(w);
        w.attackCooldown = WOLF_ATTACK_COOLDOWN;
      }
    } else {
      // No target: follow the player, keeping a little distance.
      const toP = Math.hypot(px - w.x, pz - w.z);
      if (toP > WOLF_FOLLOW_DISTANCE) {
        w.state = 'follow';
        w.yaw = Math.atan2(-(px - w.x), -(pz - w.z));
        this.step(w, toP > WOLF_LEASH_DISTANCE ? WOLF_CHASE_SPEED : WOLF_FOLLOW_SPEED, dt);
      } else {
        w.state = 'idle';
      }
    }

    const fast = w.state === 'chase' || w.state === 'follow';
    w.swingAmp += ((fast ? 0.9 : 0) - w.swingAmp) * Math.min(1, dt * 8);
    w.swingPhase += dt * (fast ? 16 : 8);
  }

  /** Choose prey: a monster to defend against at night, or livestock to hunt by day. */
  private findPrey(w: Wolf, px: number, pz: number): Monster | Animal | null {
    if (this.host.isNight()) {
      // Defend: nearest living monster within range of the player OR the fire.
      const fire = this.host.firePos();
      let best: Monster | null = null;
      let bestD = Infinity;
      for (const m of this.host.monsters.monsters) {
        if (m.state === 'dead') continue;
        const nearPlayer = Math.hypot(m.x - px, m.z - pz) <= WOLF_DEFEND_RANGE;
        const nearFire = Math.hypot(m.x - fire.x, m.z - fire.z) <= WOLF_DEFEND_RANGE;
        if (!nearPlayer && !nearFire) continue;
        const d = Math.hypot(m.x - w.x, m.z - w.z);
        if (d < bestD) {
          bestD = d;
          best = m;
        }
      }
      return best;
    }
    // Day: nearest living animal within hunt range of the wolf.
    let best: Animal | null = null;
    let bestD = WOLF_HUNT_RANGE;
    for (const a of this.host.livestock.animals) {
      if (a.state === 'dead') continue;
      const d = Math.hypot(a.x - w.x, a.z - w.z);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    return best;
  }

  /** Bite the current prey: damage a monster, or kill-and-deliver livestock. */
  private biteprey(w: Wolf): void {
    const prey = w.prey;
    if (!prey) return;
    if ('attackCooldown' in prey) {
      // It's a Monster.
      this.host.monsters.hit(prey as Monster, WOLF_ATTACK_DAMAGE, w.x, w.z);
      if ((prey as Monster).state === 'dead') w.prey = null;
    } else {
      // It's an Animal: hunt it; when killed, deliver raw meat to the campfire.
      const killed = this.host.livestock.hit(prey as Animal, WOLF_ATTACK_DAMAGE, w.x, w.z);
      if (killed) {
        const fire = this.host.firePos();
        const a = Math.random() * Math.PI * 2;
        this.host.drops.spawn('raw_meat', 1, fire.x + Math.cos(a) * 1.6, fire.z + Math.sin(a) * 1.6);
        w.prey = null;
      }
    }
  }

  private preyAlive(prey: Monster | Animal): boolean {
    return prey.state !== 'dead';
  }
  private preyX(prey: Monster | Animal): number {
    return prey.x;
  }
  private preyZ(prey: Monster | Animal): number {
    return prey.z;
  }

  // ---- shared ----

  /** Walk forward; returns false if blocked by trees/water/edge. */
  private step(w: Wolf, speed: number, dt: number): boolean {
    const dist = speed * dt;
    const nx = w.x - Math.sin(w.yaw) * dist;
    const nz = w.z - Math.cos(w.yaw) * dist;
    const r = this.host.colliders.resolve(nx, nz, WOLVES[w.kind].radius);
    if (!this.host.isLand(r.x, r.z)) return false;
    w.x = r.x;
    w.z = r.z;
    return true;
  }

  private animate(w: Wolf, dt: number): void {
    w.hurt = Math.max(0, w.hurt - dt);
    w.y += (this.host.groundHeight(w.x, w.z) - w.y) * Math.min(1, dt * 10);
    const diff = Math.atan2(Math.sin(w.yaw - w.visualYaw), Math.cos(w.yaw - w.visualYaw));
    w.visualYaw += diff * Math.min(1, dt * 8);
    w.group.position.set(w.x, w.y, w.z);
    w.group.rotation.y = w.visualYaw;
    const swing = Math.sin(w.swingPhase) * w.swingAmp;
    // Four legs swing as diagonal pairs (0,1) vs (2,3).
    w.legs.forEach((leg, i) => (leg.rotation.x = i < 2 ? swing : -swing));
    const squash = w.hurt > 0 ? 1 - 0.2 * (w.hurt / WOLF_HURT_TIME) : 1;
    w.group.scale.set(1 + (1 - squash) * 0.5, squash, 1 + (1 - squash) * 0.5);
  }

  // ---- spawning ----

  private findSpawnSpot(random: () => number): { x: number; z: number } | null {
    for (let i = 0; i < 40; i++) {
      const angle = random() * Math.PI * 2;
      const r = 18 + random() * (ISLAND_RADIUS - 30 - 18);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!this.host.isLand(x, z)) continue;
      if (this.host.colliders.overlaps(x, z, 0.8)) continue;
      return { x, z };
    }
    return null;
  }

  private spawn(kind: WolfKind, x: number, z: number): Wolf {
    const model = createWolfModel(kind);
    const yaw = Math.random() * Math.PI * 2;
    const wolf: Wolf = {
      kind,
      hp: WOLF_HP,
      x,
      y: this.host.groundHeight(x, z),
      z,
      yaw,
      visualYaw: yaw,
      state: 'idle',
      timer: rand(0, 3),
      hurt: 0,
      attackCooldown: 0,
      tamed: false,
      fed: 0,
      prey: null,
      group: model.group,
      legs: model.legs,
      swingPhase: Math.random() * 6,
      swingAmp: 0,
    };
    model.group.position.set(x, wolf.y, z);
    this.group.add(model.group);
    this.wolves.push(wolf);
    return wolf;
  }
}
