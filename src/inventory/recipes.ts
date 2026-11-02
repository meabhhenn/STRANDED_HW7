import { CRAFT_COSTS } from '../config';
import type { Inventory } from './Inventory';
import { ITEMS, type ItemId } from './Item';

/** One ingredient line of a recipe. */
export interface Ingredient {
  item: ItemId;
  count: number;
}

/** A craftable item: what it produces and what it consumes. */
export interface Recipe {
  /** The item id produced (one is made per craft). */
  output: ItemId;
  /** Items consumed from the inventory. */
  cost: readonly Ingredient[];
}

/**
 * All crafting recipes. Costs live in config.ts (CRAFT_COSTS); this module turns
 * them into Recipe objects and provides the inventory checks/consumption. Add a
 * recipe by adding its item id to CRAFT_COSTS and listing it in RECIPE_ORDER.
 */
const RECIPE_ORDER: readonly ItemId[] = ['wooden_spear', 'stone_axe', 'iron_spear', 'gun'];

export const CRAFTING_RECIPES: readonly Recipe[] = RECIPE_ORDER.map((output) => ({
  output,
  cost: CRAFT_COSTS[output as keyof typeof CRAFT_COSTS].map((c) => ({ item: c.item as ItemId, count: c.count })),
}));

/** Display name of a recipe's output. */
export function recipeName(recipe: Recipe): string {
  return ITEMS[recipe.output].name;
}

/** True if the inventory holds enough of every ingredient. */
export function canCraft(recipe: Recipe, inventory: Inventory): boolean {
  return recipe.cost.every((c) => inventory.count(c.item) >= c.count);
}

/**
 * Attempt a craft: checks ingredients, consumes them, and adds the output.
 * Returns true on success. If the output doesn't fit, the ingredients are not
 * consumed (so the player never loses materials to a full inventory).
 */
export function craft(recipe: Recipe, inventory: Inventory): boolean {
  if (!canCraft(recipe, inventory)) return false;
  // Make sure the result has somewhere to go before spending anything.
  if (!hasRoomFor(recipe.output, inventory)) return false;
  for (const c of recipe.cost) removeTotal(inventory, c.item, c.count);
  inventory.add(recipe.output, 1);
  return true;
}

/** True if one `id` would fit somewhere in the inventory (empty slot or a non-full stack). */
function hasRoomFor(id: ItemId, inventory: Inventory): boolean {
  const max = ITEMS[id].maxStack;
  return inventory.slots.some((s) => s === null || (s.id === id && s.count < max));
}

/** Remove `count` of `id` spread across slots (callers ensure enough exists). */
function removeTotal(inventory: Inventory, id: ItemId, count: number): void {
  let left = count;
  inventory.slots.forEach((s, i) => {
    if (left <= 0 || !s || s.id !== id) return;
    const removed = inventory.removeFromSlot(i, Math.min(left, s.count));
    if (removed) left -= removed.count;
  });
}
