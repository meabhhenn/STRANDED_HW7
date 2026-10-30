import { ITEMS } from '../inventory/Item';
import { itemIconUrl } from './icons';
import type { Inventory } from '../inventory/Inventory';
import type { PlayerStats } from '../player/Stats';

/**
 * In-game DOM HUD: hotbar, status line, interaction prompt and toast messages.
 * Markup/CSS is in index.html. Always use textContent (never innerHTML) for
 * dynamic text. Future home for the hunger and health bars.
 */
export class Hud {
  private readonly hotbar = document.getElementById('hotbar') as HTMLElement;
  private readonly info = document.getElementById('hud-info') as HTMLElement;
  private readonly promptEl = document.getElementById('prompt') as HTMLElement;
  private readonly toastEl = document.getElementById('toast') as HTMLElement;
  private readonly healthFill = document.getElementById('health-fill') as HTMLElement;
  private readonly healthLabel = document.getElementById('health-label') as HTMLElement;
  private readonly hungerFill = document.getElementById('hunger-fill') as HTMLElement;
  private readonly hungerLabel = document.getElementById('hunger-label') as HTMLElement;
  private readonly crosshair = document.getElementById('crosshair') as HTMLElement;
  private toastTimer = 0;

  private inventory: Inventory | null = null;

  /** Show (and follow) this inventory. Call again for a new run. */
  bind(inventory: Inventory): void {
    this.inventory = inventory;
    inventory.onChange(() => {
      if (this.inventory === inventory) this.renderHotbar();
    });
    this.renderHotbar();
  }

  setInfo(text: string): void {
    if (this.info.textContent !== text) this.info.textContent = text;
  }

  /** Update the health and hunger bars. */
  setStats(stats: PlayerStats): void {
    const h = Math.ceil(stats.health);
    const u = Math.ceil(stats.hunger);
    this.healthFill.style.width = `${(stats.health / stats.maxHealth) * 100}%`;
    this.hungerFill.style.width = `${(stats.hunger / stats.maxHunger) * 100}%`;
    this.hungerFill.classList.toggle('starving', stats.isStarving);
    const hl = `Health ${h}`;
    const ul = stats.isStarving ? 'Starving!' : `Hunger ${u}`;
    if (this.healthLabel.textContent !== hl) this.healthLabel.textContent = hl;
    if (this.hungerLabel.textContent !== ul) this.hungerLabel.textContent = ul;
  }

  /** The centre dot is only accurate in first person, so Game hides it when zoomed out. */
  setCrosshair(visible: boolean): void {
    this.crosshair.classList.toggle('hidden', !visible);
  }

  setPrompt(text: string | null): void {
    const value = text ?? '';
    if (this.promptEl.textContent !== value) this.promptEl.textContent = value;
    this.promptEl.classList.toggle('hidden', !text);
  }

  toast(text: string, ms = 2800): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), ms);
  }

  private renderHotbar(): void {
    this.hotbar.replaceChildren();
    const inventory = this.inventory;
    if (!inventory) return;
    inventory.slots.forEach((stack, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot' + (i === inventory.selected ? ' selected' : '');

      const key = document.createElement('span');
      key.className = 'key';
      key.textContent = String((i + 1) % 10);
      slot.appendChild(key);

      if (stack) {
        const def = ITEMS[stack.id];
        const icon = document.createElement('img');
        icon.className = 'icon';
        icon.src = itemIconUrl(stack.id);
        icon.alt = def.name;
        icon.title = def.name;
        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = String(stack.count);
        slot.append(icon);
        if (stack.count > 1) slot.append(count);
      }
      this.hotbar.appendChild(slot);
    });
  }
}
