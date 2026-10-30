import * as THREE from 'three';
import { toon } from '../render/materials';
import { textures } from '../render/textures';

/**
 * A simple wooden workbench placed near the campfire. It is purely a landmark
 * + collider: the actual crafting happens in the UI (ui/Crafting.ts), which the
 * player opens with C while standing within CRAFT_TABLE_REACH of this table.
 *
 * Mirrors the Campfire pattern: constructed at (x, y, z), exposes a `group`
 * to add to the scene and a `collisionRadius` World uses to register a collider.
 */
export class CraftingTable {
  readonly group = new THREE.Group();
  /** Radius of the solid base (used for player collision). */
  readonly collisionRadius = 0.8;

  constructor(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
    this.group.name = 'crafting-table';

    const plank = toon(0xffffff, { map: textures.plank() });
    const leg = toon(0x6e4524);

    // Tabletop.
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.9), plank);
    top.position.y = 0.92;
    this.group.add(top);

    // Four legs.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.86, 0.16), leg);
        l.position.set(sx * 0.52, 0.43, sz * 0.32);
        this.group.add(l);
      }
    }

    // A few tools/props on top so it reads as a workbench.
    const viceWood = toon(0x8a5a2b);
    const stump = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.26), viceWood);
    stump.position.set(0.38, 1.1, -0.18);
    this.group.add(stump);

    const blade = toon(0xcfd4d8);
    const sawBlade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.14), blade);
    sawBlade.position.set(-0.2, 1.02, 0.22);
    sawBlade.rotation.y = 0.4;
    const sawHandle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.1), viceWood);
    sawHandle.position.set(-0.46, 1.02, 0.32);
    sawHandle.rotation.y = 0.4;
    this.group.add(sawBlade, sawHandle);
  }
}
