import * as THREE from 'three';
import { ITEMS, type ItemId } from '../inventory/Item';
import { blobShadow } from '../render/materials';

export interface Pile {
  id: ItemId;
  count: number;
  x: number;
  z: number;
  mesh: THREE.Object3D;
}

/**
 * Item piles lying in the world (dropped with Q, or dropped by felled trees).
 * A pile is one stack of a single item type. The player picks piles up with E.
 */
export class DroppedItems {
  readonly group = new THREE.Group();
  readonly piles: Pile[] = [];

  /** `heightAt` supplies ground height so piles rest on the terrain. */
  constructor(private readonly heightAt: (x: number, z: number) => number) {
    this.group.name = 'dropped-items';
  }

  spawn(id: ItemId, count: number, x: number, z: number): Pile {
    const mesh = ITEMS[id].createMesh(count);
    mesh.add(blobShadow(0.55));
    mesh.position.set(x, this.heightAt(x, z), z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.group.add(mesh);
    const pile: Pile = { id, count, x, z, mesh };
    this.piles.push(pile);
    return pile;
  }

  /** Closest pile within `reach` of (x, z), or null. */
  nearest(x: number, z: number, reach: number): Pile | null {
    let best: Pile | null = null;
    let bestD = reach * reach;
    for (const p of this.piles) {
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  /** Update a pile's count (e.g. after a partial pickup); removes it at 0. */
  setCount(pile: Pile, count: number): void {
    if (count <= 0) {
      this.group.remove(pile.mesh);
      this.piles.splice(this.piles.indexOf(pile), 1);
      return;
    }
    pile.count = count;
    const old = pile.mesh;
    pile.mesh = ITEMS[pile.id].createMesh(count);
    pile.mesh.add(blobShadow(0.55));
    pile.mesh.position.copy(old.position);
    pile.mesh.rotation.copy(old.rotation);
    this.group.remove(old);
    this.group.add(pile.mesh);
  }
}
