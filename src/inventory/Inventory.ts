import { INVENTORY_SLOTS } from '../config';
import { ITEMS, type ItemId } from './Item';

export interface ItemStack {
  id: ItemId;
  count: number;
}

/**
 * Fixed-size slot inventory with a selected slot (the "hotbar" selection).
 * UI and gameplay code subscribe with `onChange` instead of polling.
 */
export class Inventory {
  readonly slots: (ItemStack | null)[] = Array.from({ length: INVENTORY_SLOTS }, () => null);
  private _selected = 0;
  private readonly listeners: (() => void)[] = [];

  get selected(): number {
    return this._selected;
  }

  get selectedStack(): ItemStack | null {
    return this.slots[this._selected];
  }

  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  select(index: number): void {
    const n = this.slots.length;
    this._selected = ((index % n) + n) % n;
    this.emit();
  }

  /** Move selection by `dir` slots (wraps around). */
  cycle(dir: number): void {
    this.select(this._selected + dir);
  }

  /** Total count of an item across all slots. */
  count(id: ItemId): number {
    return this.slots.reduce((sum, s) => sum + (s && s.id === id ? s.count : 0), 0);
  }

  /** Adds items (topping up existing stacks first). Returns how many did NOT fit. */
  add(id: ItemId, count: number): number {
    const max = ITEMS[id].maxStack;
    let left = count;
    for (const s of this.slots) {
      if (left <= 0) break;
      if (s && s.id === id && s.count < max) {
        const n = Math.min(max - s.count, left);
        s.count += n;
        left -= n;
      }
    }
    for (let i = 0; i < this.slots.length && left > 0; i++) {
      if (!this.slots[i]) {
        const n = Math.min(max, left);
        this.slots[i] = { id, count: n };
        left -= n;
      }
    }
    if (left !== count) this.emit();
    return left;
  }

  /** Removes up to `count` from a slot and returns what was removed (or null). */
  removeFromSlot(index: number, count: number): ItemStack | null {
    const s = this.slots[index];
    if (!s || count <= 0) return null;
    const n = Math.min(count, s.count);
    s.count -= n;
    if (s.count <= 0) this.slots[index] = null;
    this.emit();
    return { id: s.id, count: n };
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }
}
