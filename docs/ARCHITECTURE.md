# Architecture

## Layout

```
src/
  main.ts            entry; creates Game
  config.ts          ALL tuning constants (world size, speeds, unlock rules...)
  core/
    Game.ts          renderer, main loop, pause/resume, system wiring
    Input.ts         keyboard/mouse state (held, edge-triggered, mouse delta, click)
    Settings.ts      persisted user prefs (localStorage), e.g. mouse sensitivity
    History.ts       persisted finished runs + best streak (localStorage)
  world/
    World.ts         owns scene + world objects; spatial queries (isWalkable, groundHeight)
    Terrain.ts       seeded heightfield, biome function, vertex-coloured mesh
    Forest.ts        instanced trees, chop (hit), regrowth timers; findTarget()
    DroppedItems.ts  item piles on the ground (Q drops, felled trees)
    Colliders.ts     spatial-hash of circle colliders (trees, campfire)
    Campfire.ts      campfire visuals, log feeding, levelling, fuel, cooking
    DayNight.ts      in-game clock, sun/sky/fog; day counter
    noise.ts         seeded PRNG, value noise, math helpers
  entities/
    animals.ts       animal kinds: stats, drop tables, low-poly models
    Livestock.ts     wandering/fleeing AI, hit/kill, drops, respawn
  inventory/
    Item.ts          item ids + definitions (name, stack size, icon colour, 3D model)
    Inventory.ts     fixed slots, selection, add/remove, change events
  player/
    Player.ts        controller, first/third-person camera, body model
    Stats.ts         health + hunger model (damage/heal/feed, starving flag)
    Interaction.ts   hotbar keys, click actions (chop/feed/eat), E pick up, Q drop
  ui/
    Overlay.ts       start/pause/home overlay (markup in index.html)
    GameOver.ts      game-over screen: cause, streak, Restart / Save progress
    Hud.ts           hotbar, health/hunger bars, status line, prompts, toasts (markup in index.html)
```

## Main loop

`Game.tick()`: `player.update` -> `interaction.update` -> `world.update` -> HUD info -> `input.endFrame()` -> render. Updates are skipped while paused (pointer lock lost => pause). `dt` is clamped to 0.1s.

## Conventions

- Units: metres, seconds, radians. +Y is up. Camera looks down -Z at yaw 0.
- Tunables live in `config.ts`; avoid magic numbers in classes.
- World generation is deterministic from `WORLD_SEED`. Changing seed or generation order changes the map.
- Gameplay code asks `World` (`isWalkable`, `groundHeight`, `colliders`) instead of poking at Terrain/Forest internals.
- Input uses `KeyboardEvent.code` (physical keys). Add new bindings via `Input.anyDown/wasPressed` in the system that needs them.
- Prefer new systems as classes constructed in `Game` and ticked in `Game.tick()` while unpaused.
- No external assets yet: everything is procedural geometry and vertex colours. Keep it that way until art direction is decided, or put files in `public/` (served relative thanks to `base: './'`).

## Key design decisions

- **A/D turn, not strafe.** SPEC says they "change perspective". Interpreted as turning, so movement is only forward/back.
- **Looking.** Yaw/pitch come from mouse movement (pointer lock), A/D keys, and two-finger trackpad scroll (`Input.consumeScroll()`: browser wheel events). Natural-scrolling convention by default (swipe up = look up, swipe right = turn right); `settings.invertTrackpad` flips it and `trackpadSensitivity` scales it. Pinch arrives as ctrl+wheel (`consumePinch()`) and zooms the camera. The mouse wheel no longer selects hotbar slots (use 1-9, 0 or `[` `]`). The crosshair is hidden in third person because actions use the body's facing.
- **Camera.** Zoom (Numpad +/-, or =/-) moves the camera 0-8 m behind the player; 0 is first person and hides the body. Tap jumps first-person <-> 3 m; hold zooms smoothly. Actions use the player's facing, not the camera, so the crosshair is only exact in first person.
- **Inventory.** 10 slots, all on the hotbar (`INVENTORY_SLOTS`). Wheel/number keys select. Q drops one (Shift+Q the stack); E picks up the nearest pile within 2.5 m. Logs stack to 99.
- **Tools.** Item defs may set `chopPower` (tree damage per hit; bare hands = `PUNCH_CHOP_POWER` 1), `damage` (vs animals; fists = `PUNCH_DAMAGE` 1) and `createHeldMesh()` (model shown in hand). The selected item is what counts, so switch slots to switch tools. The player spawns with a `wooden_axe` (chopPower 2, damage 2) in slot 1 (`Game.newRun`). `Player.setHeldItem()` shows the model on the right hand (third person) and as a camera-attached view model (first person); `Player.swing()` plays the swing. New tools = new `ITEMS` entry with those fields; no other code changes needed.
- **Trees.** `TREE_HITS` (5) hit points; bare hands (1/hit) need 5 hits, the wooden axe 3. A felled tree drops one pile of 5-10 logs. Tree slots are permanent: a felled tree regrows in place after `TREE_REGROW_SECONDS` (120) over `TREE_GROW_SECONDS` (20), and waits if the player is standing there.
- **Campfire levelling.** Logs fed to the fire count toward the level (50 for level 1, +10 per level: `logsRequiredForLevel`). On completion the level increments and the counter resets. `World.campfireLevel` reads the fire's level and drives map unlocking. The per-level requirement is capped at `CAMPFIRE_MAX_LOGS_PER_LEVEL` (500, reached at level 46).
- **Campfire fuel & safe zone.** Each log also adds `CAMPFIRE_LOG_BURN_SECONDS` (90) of fuel (max 600, start 300). Fuel drains in real time. At 0 the fire goes out; after `CAMPFIRE_OUT_GRACE_SECONDS` (10) `safeZoneActive` turns false. Adding any log relights it and restores the zone. `World.isSafe(x, z)` (radius `CAMPFIRE_SAFE_RADIUS` = 20) is what enemies must check. Campfire exposes `onLowFuel/onExtinguished/onSafeZoneLost` callbacks (wired to toasts in Game).
- **Health & hunger.** `PlayerStats`: hunger 100, drains 0.1/s (x3 sprinting). At 0 hunger the player is starving: no sprint, 70% speed, and health drains at `STARVATION_DAMAGE_PER_SECOND` (0.5). Health never regenerates; it only changes via `damage(n, source)` and `heal(n)`. Items with `heal` and/or `hunger` set in `ITEMS` are consumable: click uses the selected one (food, bandage, medkit...). `onDeath(cause)` carries the `DamageSource` ('monster' | 'starvation').
- **Run lifecycle.** `Game` has states menu / playing / paused / gameover / home. A run = World + Player + Inventory + PlayerStats + Interaction, all rebuilt by `Game.newRun()` (the old scene is disposed). Add any new per-run system there.
- **Streak.** `DayNight.nightsSurvived` increments at each dawn (6:00); that is the streak. On death the run is recorded to `History` immediately (so it is never lost), then the game-over screen offers Restart (new run now) or Save progress (back to the home screen; "New game" starts a fresh run). Nothing about an in-progress run is persisted across page reloads.
- **Livestock.** `LIVESTOCK_COUNTS` cows/sheep/chickens spawn in the forest (seeded). States: idle -> wander -> idle; a hit makes them flee from the player for `ANIMAL_FLEE_SECONDS`. Bare hands do `PUNCH_DAMAGE` (1); an item's `damage` overrides it (hook for weapons). HP: chicken 2, sheep 4, cow 6. Kills spawn drop piles (tables in `animals.ts`: meat + leather/wool/feathers) and queue a respawn after 90 s at least 35 m from the player. Animals avoid trees via the shared collider grid and stay on `World.isLand()`. Click prefers an animal over a tree when both are in reach.
- **Cooking.** Q-dropping raw meat while the drop point is within `COOK_DROP_RADIUS` (1.8 m) of the fire calls `Campfire.cook(n)` instead of dropping it. Up to `COOK_CAPACITY` (10) pieces cook at once for `COOK_SECONDS` (8); timers pause if the fire goes out, and a fire that is out refuses meat (it falls on the ground). When a batch finishes, `Campfire.onCooked` makes `World` spawn a `cooked_meat` pile beside the fire. Raw meat: 8 hunger. Cooked: 35 hunger + 5 health.
- **No jumping / no gravity.** The player is snapped to terrain height (smoothed).
- **Map unlocking.** `World.unlockedRadius` grows with `campfireLevel` (`BASE_UNLOCK_RADIUS + UNLOCK_RADIUS_PER_LEVEL * (level-1)`). The desert (north, z < ~-70) is blocked until level `DESERT_UNLOCK_LEVEL` (50). The block is currently an invisible wall; a visual cue is on the roadmap.
- **Day/night.** 10 real minutes per 24h (`DAY_LENGTH_SECONDS`). `DayNight.day` increments at midnight; `isNight` is the hook for monster spawns. The player currently starts at 8am on day 1. Day is bright and saturated on purpose (the "too perfect" feel); the horror layer should be added on top (silence, subtle wrongness).
- **Performance.** Trees are 3 InstancedMeshes; collisions use a spatial hash. No shadows yet.

## Extending: where things plug in

| Feature | Hook |
| --- | --- |
| New animals / monsters | Follow `entities/animals.ts` + `Livestock.ts`; hostile ones should check `world.isSafe()` |
| New click actions (eat, attack, tools) | `Interaction.act()` / `findClickTarget()` |
| Damage the player | `stats.damage(n, 'monster')` (add new `DamageSource`s in `Stats.ts`) |
| New items (consumables: set `hunger` and/or `heal`) | `ItemId` + `ITEMS` in `inventory/Item.ts` |
| Hunger | New system reading `player.isSprinting` / `isMoving`; drain faster when sprinting |
| Campfire levels / safe zone | `Campfire` (add logs, timer) and `world.campfireLevel` |
| Monsters, wolves | Use `world.colliders`, `world.groundHeight`, `dayNight.isNight` |
| Pause/home screen | Extend `ui/Overlay.ts` and `Settings.ts` |
