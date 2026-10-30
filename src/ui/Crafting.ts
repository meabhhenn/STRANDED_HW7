import type { Inventory } from '../inventory/Inventory';
import { ITEMS } from '../inventory/Item';
import { CRAFTING_RECIPES, canCraft, recipeName, type Recipe } from '../inventory/recipes';
import { itemIconUrl } from './icons';

/**
 * Crafting menu (markup/CSS in index.html). Shows the fixed recipe list with
 * icons and ingredient costs; a recipe's button is disabled unless the player
 * has the materials. Follows the Overlay/GameOver pattern: Game owns the state
 * and passes a callback that performs the craft and returns whether it worked.
 *
 * This menu only displays and triggers; the actual item changes happen in
 * inventory/recipes.ts via the callback.
 */
export class Crafting {
  private readonly root = document.getElementById('crafting') as HTMLElement;
  private readonly list = document.getElementById('craft-list') as HTMLElement;
  private inventory: Inventory | null = null;

  /** `onCraft` performs the craft and returns true on success (so we can re-render). */
  constructor(private readonly onCraft: (recipe: Recipe) => boolean) {}

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  /** Open the menu for the given inventory and render the recipes. */
  show(inventory: Inventory): void {
    this.inventory = inventory;
    this.render();
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.root.classList.add('hidden');
    this.inventory = null;
  }

  private render(): void {
    const inventory = this.inventory;
    this.list.replaceChildren();
    if (!inventory) return;

    for (const recipe of CRAFTING_RECIPES) {
      const li = document.createElement('li');
      li.className = 'recipe';

      const icon = document.createElement('img');
      icon.className = 'icon';
      icon.src = itemIconUrl(recipe.output);
      icon.alt = recipeName(recipe);

      const info = document.createElement('div');
      info.className = 'info';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = recipeName(recipe);
      const cost = document.createElement('div');
      cost.className = 'cost';
      // One line per ingredient: "3 / 5 Log" style (have / needed is clearer as needed + have).
      for (const c of recipe.cost) {
        const have = inventory.count(c.item);
        const row = document.createElement('div');
        if (have < c.count) row.className = 'short';
        row.textContent = `${ITEMS[c.item].name} x${c.count}  (have ${have})`;
        cost.appendChild(row);
      }
      info.append(name, cost);

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Craft';
      button.disabled = !canCraft(recipe, inventory);
      button.addEventListener('click', () => {
        if (this.onCraft(recipe)) this.render(); // refresh counts / disabled states
      });

      li.append(icon, info, button);
      this.list.appendChild(li);
    }
  }
}
