import {
  AIM_MIN_DOT,
  COOK_DROP_RADIUS,
  ANIMAL_AIM_MIN_DOT,
  ANIMAL_REACH,
  ATTACK_COOLDOWN,
  CHOP_COOLDOWN,
  DROP_DISTANCE,
  EAT_COOLDOWN,
  FEED_COOLDOWN,
  LOGS_PER_TREE_MAX,
  LOGS_PER_TREE_MIN,
  MIN_WALK_HEIGHT,
  PICKUP_DISTANCE,
  PUNCH_CHOP_POWER,
  PUNCH_DAMAGE,
  REACH_DISTANCE,
} from '../config';
import type { Input } from '../core/Input';
import { Inventory } from '../inventory/Inventory';
import { ITEMS } from '../inventory/Item';
import { ANIMALS } from '../entities/animals';
import type { Animal } from '../entities/Livestock';
import type { Hud } from '../ui/Hud';
import type { PlayerStats } from './Stats';
import type { Pile } from '../world/DroppedItems';
import type { Tree } from '../world/Forest';
import type { World } from '../world/World';
import type { Player } from './Player';

/** Hunger and health an item restores when used. */
interface Consumable {
  hunger: number;
  heal: number;
}

/** What the player's click would act on right now. */
type ClickTarget =
  | { kind: 'campfire' }
  | { kind: 'tree'; tree: Tree }
  | { kind: 'animal'; animal: Animal }
  | null;

const HOTBAR_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];

/**
 * Turns input into world actions:
 *  - 1-9,0 or [ ]: select inventory slot
 *  - Click: eat the selected food item; else (hold to repeat) feed the campfire with a selected log, else attack the animal / chop the tree in front (whichever is closer)
 *  - E: pick up the nearest dropped pile
 *  - Q: drop one of the selected item (Shift+Q drops the whole stack)
 *
 * Targets are chosen from the player's facing direction, not the camera, so it
 * behaves the same in first and third person. Add new click actions in `act()`.
 */
export class Interaction {
  private cooldown = 0;

  constructor(
    private readonly player: Player,
    private readonly world: World,
    private readonly inventory: Inventory,
    private readonly hud: Hud,
    private readonly stats: PlayerStats,
  ) {}

  update(dt: number, input: Input): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.player.setHeldItem(this.inventory.selectedStack?.id ?? null);

    // Hotbar selection
    HOTBAR_KEYS.forEach((code, i) => {
      if (input.wasPressed(code)) this.inventory.select(i);
    });
    if (input.wasPressed('BracketRight')) this.inventory.cycle(1);
    if (input.wasPressed('BracketLeft')) this.inventory.cycle(-1);

    if (input.wasPressed('KeyE')) this.pickUp();
    if (input.wasPressed('KeyQ')) this.drop(input.anyDown('ShiftLeft', 'ShiftRight'));

    const food = this.selectedFood();
    const target = food ? null : this.findClickTarget();
    if (input.isMouseDown && this.cooldown <= 0) {
      if (food) this.eat(food);
      else if (target) this.act(target);
    }
    input.consumeClick(); // edge flag unused for now; keep it from accumulating

    this.hud.setPrompt(this.promptFor(target, food));
  }

  // ---- targeting ----

  private findClickTarget(): ClickTarget {
    const { x, z } = this.player.position;
    const f = this.player.facing;

    if (this.inventory.selectedStack?.id === 'log') {
      const fire = this.world.campfire.group.position;
      const dx = fire.x - x;
      const dz = fire.z - z;
      const d = Math.hypot(dx, dz);
      if (d <= REACH_DISTANCE && (dx * f.x + dz * f.z) / (d || 1) >= AIM_MIN_DOT - 0.2) {
        return { kind: 'campfire' };
      }
    }
    const tree = this.world.forest.findTarget(x, z, f.x, f.z, REACH_DISTANCE, AIM_MIN_DOT);
    const animal = this.world.livestock.findTarget(x, z, f.x, f.z, ANIMAL_REACH, ANIMAL_AIM_MIN_DOT);
    // Animals win ties: they're moving, so give them priority when both are in reach.
    if (animal && (!tree || Math.hypot(animal.x - x, animal.z - z) <= Math.hypot(tree.x - x, tree.z - z) + 0.5)) {
      return { kind: 'animal', animal };
    }
    return tree ? { kind: 'tree', tree } : null;
  }

  private stack() {
    return this.inventory.selectedStack;
  }

  /** Where Q would drop an item (clamped to the player's feet over water). */
  private dropPoint(): { x: number; z: number } {
    const f = this.player.facing;
    const { x: px, z: pz } = this.player.position;
    const x = px + f.x * DROP_DISTANCE;
    const z = pz + f.z * DROP_DISTANCE;
    // Never drop into the water: fall back to the player's feet.
    return this.world.groundHeight(x, z) < MIN_WALK_HEIGHT ? { x: px, z: pz } : { x, z };
  }

  private dropPointNearFire(): boolean {
    const p = this.dropPoint();
    const fire = this.world.campfire.group.position;
    return Math.hypot(p.x - fire.x, p.z - fire.z) <= COOK_DROP_RADIUS;
  }

  private nearestPile(): Pile | null {
    return this.world.drops.nearest(this.player.position.x, this.player.position.z, PICKUP_DISTANCE);
  }

  private selectedFood(): Consumable | null {
    const stack = this.inventory.selectedStack;
    const def = stack ? ITEMS[stack.id] : undefined;
    if (!def || (!def.hunger && !def.heal)) return null;
    return { hunger: def.hunger ?? 0, heal: def.heal ?? 0 };
  }

  /** True if using the consumable would actually restore something. */
  private wouldHelp(c: Consumable): boolean {
    return (c.hunger > 0 && this.stats.hunger < this.stats.maxHunger) || (c.heal > 0 && this.stats.health < this.stats.maxHealth);
  }

  private promptFor(target: ClickTarget, food: Consumable | null): string | null {
    const pile = this.nearestPile();
    if (pile) return `E: pick up ${pile.count} ${ITEMS[pile.id].name}${pile.count > 1 ? 's' : ''}`;
    if (this.stack()?.id === 'raw_meat' && this.dropPointNearFire()) {
      return this.world.campfire.lit ? 'Q: drop in fire to cook  |  Click: eat raw' : 'The fire is out: relight it to cook';
    }
    if (food) return this.wouldHelp(food) ? (food.hunger > 0 ? 'Click: eat' : 'Click: use') : null;
    if (target?.kind === 'campfire') return 'Hold click: add log to campfire';
    if (target?.kind === 'tree') {
      const stack = this.inventory.selectedStack;
      const hasAxe = !!stack && !!ITEMS[stack.id].chopPower;
      return hasAxe ? 'Hold click: chop tree' : 'Hold click: chop tree (an axe is faster)';
    }
    if (target?.kind === 'animal') return `Hold click: attack ${ANIMALS[target.animal.kind].name}`;
    return null;
  }

  // ---- actions ----

  private act(target: NonNullable<ClickTarget>): void {
    if (target.kind === 'campfire') {
      this.feedCampfire();
    } else if (target.kind === 'animal') {
      this.attack(target.animal);
    } else {
      this.chop(target.tree);
    }
  }

  private attack(animal: Animal): void {
    this.cooldown = ATTACK_COOLDOWN;
    this.player.swing();
    const stack = this.inventory.selectedStack;
    const damage = (stack && ITEMS[stack.id].damage) || PUNCH_DAMAGE;
    const { x, z } = this.player.position;
    if (this.world.livestock.hit(animal, damage, x, z)) {
      this.hud.toast(`Killed a ${ANIMALS[animal.kind].name}: pick up the drops with E`);
    }
  }

  private eat(food: Consumable): void {
    this.cooldown = EAT_COOLDOWN;
    if (!this.wouldHelp(food)) return;
    if (!this.inventory.removeFromSlot(this.inventory.selected, 1)) return;
    this.stats.feed(food.hunger);
    this.stats.heal(food.heal);
  }

  private feedCampfire(): void {
    this.cooldown = FEED_COOLDOWN;
    if (!this.inventory.removeFromSlot(this.inventory.selected, 1)) return;
    this.world.campfire.addLog(); // level-up message is raised via campfire.onLevelUp
  }

  private chop(tree: Tree): void {
    this.cooldown = CHOP_COOLDOWN;
    this.player.swing();
    const stack = this.inventory.selectedStack;
    const power = (stack && ITEMS[stack.id].chopPower) || PUNCH_CHOP_POWER;
    if (!this.world.forest.hit(tree, power)) return;
    const n = LOGS_PER_TREE_MIN + Math.floor(Math.random() * (LOGS_PER_TREE_MAX - LOGS_PER_TREE_MIN + 1));
    // Land the logs in a small pile at the stump, nudged toward the player.
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const d = Math.hypot(px - tree.x, pz - tree.z) || 1;
    const x = tree.x + ((px - tree.x) / d) * 0.9;
    const z = tree.z + ((pz - tree.z) / d) * 0.9;
    this.world.drops.spawn('log', n, x, z);
    this.hud.toast(`Tree felled: ${n} logs dropped`);
  }

  private pickUp(): void {
    const pile = this.nearestPile();
    if (!pile) return;
    const left = this.inventory.add(pile.id, pile.count);
    if (left === pile.count) {
      this.hud.toast('Inventory full');
      return;
    }
    this.world.drops.setCount(pile, left);
    if (left > 0) this.hud.toast('Inventory full: left some behind');
  }

  private drop(wholeStack: boolean): void {
    const stack = this.inventory.selectedStack;
    if (!stack) return;
    const { x, z } = this.dropPoint();
    const removed = this.inventory.removeFromSlot(this.inventory.selected, wholeStack ? stack.count : 1);
    if (!removed) return;

    let count = removed.count;
    // Raw meat dropped into a lit fire cooks instead of landing on the ground.
    if (removed.id === 'raw_meat' && this.dropPointNearFire()) {
      const fire = this.world.campfire;
      const accepted = fire.cook(count);
      if (accepted > 0) {
        count -= accepted;
        this.hud.toast(`Cooking ${accepted} meat... it will appear beside the fire`);
      } else {
        this.hud.toast(fire.lit ? 'The fire is full of meat already' : 'The fire is out: relight it to cook');
      }
    }
    if (count > 0) this.world.drops.spawn(removed.id, count, x, z);
  }
}
