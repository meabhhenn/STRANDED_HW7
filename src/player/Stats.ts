import {
  HUNGER_DRAIN_PER_SECOND,
  HUNGER_SPRINT_MULTIPLIER,
  MAX_HEALTH,
  MAX_HUNGER,
  STARVATION_DAMAGE_PER_SECOND,
} from '../config';

/** What killed (or hurt) the player. Add entries as enemies are added. */
export type DamageSource = 'monster' | 'starvation';

/**
 * Health and hunger (SPEC feature 2).
 *  - Hunger drains over time, faster while sprinting.
 *  - Health decreases through `damage()` (monsters/entities). Once hunger is
 *    empty the player is "starving": health also drains continuously, and
 *    Game tells Player to disable sprint and slow down.
 *  - Health never regenerates by itself. It only comes back from `heal()`
 *    (bandage, medkit, healing staff) or eating (items with a `heal` value).
 */
export class PlayerStats {
  readonly maxHealth = MAX_HEALTH;
  readonly maxHunger = MAX_HUNGER;
  health = MAX_HEALTH;
  hunger = MAX_HUNGER;
  /** Source of the most recent damage (the cause of death once dead). */
  lastDamageSource: DamageSource = 'monster';
  /** Called once when health reaches 0. */
  onDeath?: (cause: DamageSource) => void;

  get isStarving(): boolean {
    return this.hunger <= 0;
  }

  get isDead(): boolean {
    return this.health <= 0;
  }

  update(dt: number, sprinting: boolean): void {
    if (this.isDead) return;
    const rate = HUNGER_DRAIN_PER_SECOND * (sprinting ? HUNGER_SPRINT_MULTIPLIER : 1);
    this.hunger = Math.max(0, this.hunger - rate * dt);
    if (this.isStarving) this.damage(STARVATION_DAMAGE_PER_SECOND * dt, 'starvation');
  }

  damage(amount: number, source: DamageSource = 'monster'): void {
    if (this.isDead || amount <= 0) return;
    this.lastDamageSource = source;
    this.health = Math.max(0, this.health - amount);
    if (this.isDead) this.onDeath?.(source);
  }

  heal(amount: number): void {
    if (this.isDead) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /** Restore hunger (eating). */
  feed(amount: number): void {
    if (this.isDead) return;
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
  }
}
