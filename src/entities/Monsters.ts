import * as THREE from 'three';
import {
  ISLAND_RADIUS,
  MONSTER_ATTACK_COOLDOWN,
  MONSTER_ATTACK_DAMAGE,
  MONSTER_ATTACK_RANGE,
  MONSTER_CHASE_SPEED,
  MONSTER_DEATH_TIME,
  MONSTER_DETECT_RANGE,
  MONSTER_HURT_TIME,
  MONSTER_MAX_ALIVE,
  MONSTER_RETREAT_SPEED,
  MONSTER_SPAWN_INTERVAL,
  MONSTER_SPAWN_MAX_DISTANCE,
  MONSTER_SPAWN_MIN_DISTANCE,
  MONSTER_WANDER_SPEED,
} from '../config';
import type { PlayerStats } from '../player/Stats';
import type { ColliderGrid } from '../world/Colliders';
import { MONSTERS, createMonsterModel, type MonsterKind } from './monsterKinds';

/** The slice of World that monsters need (avoids a circular import). */
export interface MonsterHost {
  colliders: ColliderGrid;
  groundHeight(x: number, z: number): number;
  /** Ground a monster may stand on (dry, walkable; monsters roam the island). */
  isLand(x: number, z: number): boolean;
  /** True while the campfire safe zone is active at (x, z). Monsters stay out. */
  isSafe(x: number, z: number): boolean;
  /** True only during the in-game night; monsters only spawn then. */
  isNight(): boolean;
}

type MonsterState = 'wander' | 'chase' | 'retreat' | 'dead';

export interface Monster {
  kind: MonsterKind;
  hp: number;
  x: number;
  y: number;
  z: number;
  /** Heading: forward = (-sin yaw, -cos yaw), same as the player. */
  yaw: number;
  state: MonsterState;
  /** Seconds left in the current state (death: seconds since death). */
  timer: number;
  /** Seconds of hit squash animation left. */
  hurt: number;
  /** Seconds until this monster may attack again. */
  attackCooldown: number;
  group: THREE.Group;
  legs: THREE.Object3D[];
  swingPhase: number;
  swingAmp: number;
  visualYaw: number;
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

/**
 * Hostile night monsters. They spawn only while it is night (and only outside
 * the campfire safe zone), chase the player, and deal damage with
 * `stats.damage(n, 'monster')`. They never enter the safe zone: a monster that
 * finds itself inside it retreats to the edge. The player can kill one with the
 * existing click attack (see Interaction.act); the kill/clear lifecycle follows
 * the same shape as Livestock.
 */
export class Monsters {
  readonly group = new THREE.Group();
  readonly monsters: Monster[] = [];
  private spawnTimer = 0;

  constructor(private readonly host: MonsterHost) {
    this.group.name = 'monsters';
  }

  /** Living monsters currently in the world. */
  get aliveCount(): number {
    let n = 0;
    for (const m of this.monsters) if (m.state !== 'dead') n++;
    return n;
  }

  /** Best living monster in front of (x, z): within reach and aim cone, closest first. */
  findTarget(x: number, z: number, fx: number, fz: number, reach: number, minDot: number): Monster | null {
    let best: Monster | null = null;
    let bestD = reach;
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const dx = m.x - x;
      const dz = m.z - z;
      const d = Math.hypot(dx, dz) - MONSTERS[m.kind].radius * 0.5;
      if (d > bestD) continue;
      if (d > 0.3 && (dx * fx + dz * fz) / Math.hypot(dx, dz) < minDot) continue;
      bestD = d;
      best = m;
    }
    return best;
  }

  /**
   * Hit a monster. It is knocked back from (fromX, fromZ). On death it plays the
   * death animation and is removed. Returns true if this hit killed it.
   */
  hit(monster: Monster, damage: number, fromX: number, fromZ: number): boolean {
    if (monster.state === 'dead') return false;
    monster.hp -= damage;
    monster.hurt = MONSTER_HURT_TIME;
    if (monster.hp <= 0) {
      monster.state = 'dead';
      monster.timer = 0;
      return true;
    }
    // Small knockback away from the attacker; keep chasing afterwards.
    monster.yaw = Math.atan2(-(monster.x - fromX), -(monster.z - fromZ));
    this.step(monster, -0.6, 1);
    return false;
  }

  update(dt: number, px: number, pz: number, stats: PlayerStats): void {
    this.updateSpawns(dt, px, pz);
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (m.state === 'dead') {
        m.timer += dt;
        m.group.rotation.z = Math.min(1, m.timer / (MONSTER_DEATH_TIME * 0.6)) * (Math.PI / 2);
        if (m.timer >= MONSTER_DEATH_TIME) {
          this.group.remove(m.group);
          this.monsters.splice(i, 1);
        }
        continue;
      }
      this.think(m, dt, px, pz, stats);
      this.animate(m, dt);
    }
  }

  // ---- behaviour ----

  private think(m: Monster, dt: number, px: number, pz: number, stats: PlayerStats): void {
    m.attackCooldown = Math.max(0, m.attackCooldown - dt);
    const dx = px - m.x;
    const dz = pz - m.z;
    const toPlayer = Math.hypot(dx, dz);

    // Never stay in the safe zone: back out toward the edge first.
    if (this.host.isSafe(m.x, m.z)) {
      m.state = 'retreat';
      m.yaw = Math.atan2(m.x, m.z); // heading away from the origin (campfire)
      this.step(m, MONSTER_RETREAT_SPEED, dt);
    } else if (toPlayer <= MONSTER_DETECT_RANGE && !this.host.isSafe(px, pz)) {
      // Chase the player, but don't follow them into the safe zone.
      m.state = 'chase';
      m.yaw = Math.atan2(-dx, -dz);
      if (toPlayer > MONSTER_ATTACK_RANGE) {
        this.step(m, MONSTER_CHASE_SPEED, dt);
      } else if (m.attackCooldown <= 0) {
        stats.damage(MONSTER_ATTACK_DAMAGE, 'monster');
        m.attackCooldown = MONSTER_ATTACK_COOLDOWN;
      }
    } else {
      // Idle wander: pick a new heading now and then and shuffle forward.
      if (m.state !== 'wander' || m.timer <= 0) {
        m.state = 'wander';
        m.timer = rand(2, 4);
        m.yaw = Math.random() * Math.PI * 2;
      }
      m.timer -= dt;
      if (!this.step(m, MONSTER_WANDER_SPEED, dt)) m.timer = 0;
    }

    const fast = m.state === 'chase' || m.state === 'retreat';
    const moving = fast || m.state === 'wander';
    m.swingAmp += ((moving ? (fast ? 0.9 : 0.5) : 0) - m.swingAmp) * Math.min(1, dt * 8);
    m.swingPhase += dt * (fast ? 16 : 8);
  }

  /** Walk forward (negative speed = step backward); returns false if blocked. */
  private step(m: Monster, speed: number, dt: number): boolean {
    const dist = speed * dt;
    const nx = m.x - Math.sin(m.yaw) * dist;
    const nz = m.z - Math.cos(m.yaw) * dist;
    const r = this.host.colliders.resolve(nx, nz, MONSTERS[m.kind].radius);
    if (!this.host.isLand(r.x, r.z)) return false;
    m.x = r.x;
    m.z = r.z;
    return true;
  }

  private animate(m: Monster, dt: number): void {
    m.hurt = Math.max(0, m.hurt - dt);
    m.y += (this.host.groundHeight(m.x, m.z) - m.y) * Math.min(1, dt * 10);
    // Smoothly turn the model toward the heading (shortest way round).
    const diff = Math.atan2(Math.sin(m.yaw - m.visualYaw), Math.cos(m.yaw - m.visualYaw));
    m.visualYaw += diff * Math.min(1, dt * 8);
    m.group.position.set(m.x, m.y, m.z);
    m.group.rotation.y = m.visualYaw;
    const swing = Math.sin(m.swingPhase) * m.swingAmp;
    m.legs.forEach((leg, i) => (leg.rotation.x = i < 1 ? swing : -swing));
    // Squash when hit.
    const squash = m.hurt > 0 ? 1 - 0.2 * (m.hurt / MONSTER_HURT_TIME) : 1;
    m.group.scale.set(1 + (1 - squash) * 0.5, squash, 1 + (1 - squash) * 0.5);
  }

  // ---- spawning ----

  private updateSpawns(dt: number, px: number, pz: number): void {
    // Only spawn during the night and while below the cap.
    if (!this.host.isNight() || this.aliveCount >= MONSTER_MAX_ALIVE) {
      this.spawnTimer = 0;
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = MONSTER_SPAWN_INTERVAL;
    const spot = this.findSpawnSpot(px, pz);
    if (spot) this.spawn('stalker', spot.x, spot.z);
  }

  /** A walkable, dry point a ring away from the player and outside the safe zone. */
  private findSpawnSpot(px: number, pz: number): { x: number; z: number } | null {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = MONSTER_SPAWN_MIN_DISTANCE + Math.random() * (MONSTER_SPAWN_MAX_DISTANCE - MONSTER_SPAWN_MIN_DISTANCE);
      const x = px + Math.cos(angle) * r;
      const z = pz + Math.sin(angle) * r;
      if (Math.hypot(x, z) > ISLAND_RADIUS - 15) continue;
      if (!this.host.isLand(x, z)) continue;
      if (this.host.isSafe(x, z)) continue;
      if (this.host.colliders.overlaps(x, z, 0.8)) continue;
      return { x, z };
    }
    return null;
  }

  private spawn(kind: MonsterKind, x: number, z: number): Monster {
    const model = createMonsterModel(kind);
    const yaw = Math.random() * Math.PI * 2;
    const monster: Monster = {
      kind,
      hp: MONSTERS[kind].hp,
      x,
      y: this.host.groundHeight(x, z),
      z,
      yaw,
      visualYaw: yaw,
      state: 'wander',
      timer: rand(0, 2),
      hurt: 0,
      attackCooldown: 0,
      group: model.group,
      legs: model.legs,
      swingPhase: Math.random() * 6,
      swingAmp: 0,
    };
    model.group.position.set(x, monster.y, z);
    this.group.add(model.group);
    this.monsters.push(monster);
    return monster;
  }
}
