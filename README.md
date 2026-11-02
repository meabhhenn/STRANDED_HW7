# STRANDED

Original design and foundation by Izzy (izzyh-gif). Phase 2 extended by Meabh.

A 3D island survival game: survive 50 nights after a plane crash. Built with TypeScript, Three.js and Vite. The full design is in [SPEC.md](SPEC.md). Current progress and future steps are described in [docs/ROADMAP.md](docs/ROADMAP.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

Requires Node 20+ (developed on Node 24).

## Controls (implemented)

| Input | Action |
| --- | --- |
| W / Up, S / Down | Move forward / back |
| A / Left, D / Right | Turn the view (no strafing, per spec) |
| Mouse | Look (pointer lock) |
| Two-finger swipe / pinch | Look / zoom (trackpad) |
| Shift | Sprint |
| Numpad + / Numpad - (or `=` / `-`) | Zoom camera in / out: fully in = first person, out = third person |
| Click (hold) | Swing at the monster / animal / tree / ore in front; with logs selected near the fire, add a log; with food selected, eat; with raw meat and a wild wolf in front, feed it |
| E | Pick up the nearest dropped item; or open a loot chest you are facing |
| C | Open the crafting menu (only near the crafting table beside the fire) |
| Q / Shift+Q | Drop one item / the whole stack |
| 1-9, 0 or `[` `]` | Select inventory slot |
| Esc | Pause (overlay with sensitivity slider); also closes the crafting menu |

### Dev helpers

- Dev console (`npm run dev` only): `__stranded.stats.damage(30)`, `__stranded.inventory.add('log', 50)`, `__stranded.world.campfireLevel = 5`. Handles: `__stranded.world`, `.player`, `.stats`, `.inventory`.
- Dev URL options (combine with `&`): `?hour=22` starts the clock at 10pm; `?day=10` starts on day 10. Useful combos: `?day=10&hour=22` (blood moon at night), `?day=2&hour=22` (a raid night), `?day=51` (triggers the win screen immediately).

## Acceptance criteria report

SPEC.md has no numbered acceptance criteria, so this report uses the SPEC's own structure as the criteria list: Features 1-9, Rules 1-4, User Controls, and Screens. Each line is Met / Partially met / Not met based only on what the code actually does.

### Features

1. **Open 3D world, campfire level unlocks map, forest->desert, horror feel — Partially met.** The procedural island, forest/beach/water, campfire-level map unlocking and the deliberately bright "too perfect" day all exist, but the desert is terrain/colour only (no gameplay) and there is no explicit horror layer beyond the saturated daytime.
2. **Hunger and health bars — Met.** Hunger drains over time (3x sprinting) and empties into starvation (slower, health loss); health only falls from damage and only returns via consumables, with both shown as HUD bars.
3. **Chop trees, kill livestock for meat/materials, cook meat in the fire — Met.** Trees drop logs, cows/sheep/chickens drop raw meat plus leather/wool/feathers, and dropping raw meat in the lit fire yields cooked meat worth more hunger.
4. **Tame wolves that hunt by day and fight at night — Met.** Wild wolves are tamed by feeding raw meat; tamed wolves follow the player, attack monsters near the player or fire at night, and hunt livestock by day with the meat delivered to the campfire.
5. **Three boss locations (tree spirit, cult camp, giant spider) with rare drops — Not met.** No boss locations or their rare weapon/armour drops exist (the only boss is the blood-moon beast from Rule 2, which is not a map location).
6. **Desert snake king boss granting venom abilities — Not met.** The desert has no bosses, snake army, or venom abilities.
7. **Crafting table with weapons from wood and mined metal ore — Met.** A crafting table offers wooden spear, stone axe, iron spear and gun; metal ore is mined from forest rocks like chopping a tree.
8. **Random loot chests with survival items — Met.** Seeded chests scatter on forest ground, open with E to drop 1-3 loot piles (bandage, medkit, logs, leather, sometimes a wooden spear), and respawn elsewhere after a while.
9. **Sound: footsteps, actions, ambience, enemy audio cues — Not met.** There is no audio of any kind.

### Rules

1. **Keep the campfire lit; it loses its safe zone 10 s after going out; level it up — Met.** Fuel burns in real time, the safe-zone flag drops 10 s after the fire goes out, and logs level the fire up on an increasing curve.
2. **Night attacks every other night, difficulty up every 3 days, blood moon boss every 10 — Met.** Raid nights (every other night) send monsters at the campfire, difficulty tiers raise count/HP/damage every 3 days, and every 10th night is a blood moon with a scaled boss and a red sky. Interpretation choice: on a normal night the lit campfire's safe zone keeps monsters out (they mass at the edge); on raid nights and blood moons monsters can enter the area and attack the player directly, and once the fire is out they close in and drain its fuel.
3. **A merchant comes through every other day with a task-for-items trade — Not met.** There is no merchant.
4. **Win after night 50 (plane pickup); track best streak — Met.** Reaching day 51 shows a rescue victory screen recording the run as a win, and the best streak persists across runs.

### User Controls — Met.
All specified inputs work: W/S/arrows move, A/D/arrows and the mouse turn/look, Shift sprints, click eats/uses/acts (chop, attack, mine), Q drops and E picks up, and the inventory is navigable via 1-9/0 and `[` `]`.

### Screens — Partially met.
There is a home/pause overlay (sound-less: sensitivity and trackpad settings, run history) and dedicated game-over and victory screens, but the first-run tutorial the SPEC asks for does not exist.

## Code map

```
src/
  main.ts            entry; creates Game
  config.ts          ALL tuning constants (world, player, campfire, monsters, crafting, ore, wolves, win...)
  core/
    Game.ts          renderer, main loop, run lifecycle, night-mode (raid/blood-moon) detection, win check, crafting state, dev URL options
    Input.ts         keyboard/mouse/trackpad state
    Settings.ts      persisted user prefs (localStorage)
    History.ts       persisted finished runs + best streak; RunRecord now carries an optional `won` flag
  world/
    World.ts         owns the scene + all world objects; spatial queries; constructs/updates every entity; blood-moon tint hook
    Terrain.ts       seeded heightfield, biome (forest/desert), vertex-coloured mesh
    Forest.ts        instanced trees: chop, regrow
    DroppedItems.ts  item piles on the ground
    Colliders.ts     spatial-hash circle colliders
    Campfire.ts      campfire visuals, log feeding/levelling, fuel, cooking, and damage() when raided
    CraftingTable.ts NEW: the workbench placed by the fire; a landmark + collider the crafting menu opens near
    DayNight.ts      clock, sun/sky/fog, day counter; bloodMoon flag + applyBloodMoonTint()
    Sky.ts           clouds, sun, moon (moon tints red on blood-moon nights)
    noise.ts         seeded PRNG, value noise, helpers
  entities/
    animals.ts       livestock kinds: stats, drop tables, low-poly models
    Livestock.ts     wandering/fleeing animal AI, hit/kill, drops, respawn
    monsterKinds.ts  NEW: monster kinds (stalker, blood-moon boss): stats record + low-poly models
    Monsters.ts      NEW: hostile night AI; chase the player, raid the campfire, difficulty scaling, boss spawn
    Chests.ts        NEW: seeded loot chests; open -> weighted loot table -> drops; respawn in new spots
    Rocks.ts         NEW: seeded metal-ore rocks; mined like trees (hits -> ore drop), then regrow
    wolfKinds.ts     NEW: wolf kind: stats record + four-legged low-poly model
    Wolves.ts        NEW: wild wolves (wander, flee if hit); feed to tame; tamed follow, fight monsters, hunt livestock
  inventory/
    Item.ts          item ids + definitions (now incl. metal weapons, ore, bandage/medkit; added reach/attackCooldown fields)
    Inventory.ts     fixed slots, selection, add/remove, change events
    recipes.ts       NEW: crafting recipes built from CRAFT_COSTS; canCraft/craft helpers
  player/
    Player.ts        controller, first/third-person camera, body + held-item model
    Stats.ts         health + hunger model (damage/heal/feed, starving)
    Interaction.ts   hotbar keys, click actions (chop/attack/mine/feed-fire/eat/feed-wolf), E pick up / open chest, Q drop, crafting prompt
  ui/
    Overlay.ts       start/pause/home overlay (history list shows "Rescued" for wins)
    GameOver.ts      game-over screen (cause, streak, Restart / Save progress)
    Victory.ts       NEW: rescue/win screen (reuses the game-over structure and style)
    Crafting.ts      NEW: crafting menu UI (recipe list, costs, craftable state)
    Hud.ts           hotbar, health/hunger bars, status line, prompts, toasts
    icons.ts         pixel-art item icons
```

## What I changed (Phase 2)

All of the following were added on top of Izzy's original design; nothing in the original systems was rewritten or renamed. New behaviour plugs into the existing hooks (ARCHITECTURE.md "Extending" table) and the existing config-driven, seeded, class-per-system patterns.

- **Night monsters (Rule 2):** a `Monsters` system with a stalker that spawns at night outside the safe zone, chases the player and deals `stats.damage(n, 'monster')`.
- **Raids, difficulty and blood moon (Rule 2):** raid nights target the campfire (and damage its fuel once the fire is out), difficulty tiers scale count/HP/damage every 3 days, and every 10th night is a red-sky blood moon with a scaled boss; HUD toasts announce the night type.
- **Crafting system (Feature 7):** a `CraftingTable`, a `Crafting` menu (press C nearby), a `recipes` module, and the wooden spear / stone axe recipes.
- **Metal ore and metal weapons (Feature 7):** `Rocks` to mine ore, plus the `iron_spear` and `gun` items and recipes (the gun has the longest reach, highest damage and a slower cooldown; no ammo system).
- **Loot chests (Feature 8):** `Chests` with a weighted loot table and bandage/medkit consumables.
- **Win condition (Rule 4):** a `Victory` screen at day 51 that records the run as a win.
- **Tameable wolves (Feature 4):** a `Wolves` system (wild wolves, feed raw meat to tame, tamed follow/defend/hunt).
- Supporting additive edits: new `ITEMS` entries and icons, new `config.ts` tunables, an optional `won` flag on `RunRecord`, and `?day=` dev option.

## Known issues, tuning guesses, and next steps

### Known issues / tuning guesses
- **Gun balance is a guess.** With no ammo system, the gun's only cost is its slower cooldown and its ore recipe; it may be too strong once crafted. Tune `GUN_DAMAGE` / `GUN_REACH` / `GUN_ATTACK_COOLDOWN` in `config.ts`.
- **Wolf day-hunt double drops.** When a tamed wolf kills livestock, the animal's normal corpse drops still spawn at the kill site *and* one raw meat is delivered to the campfire, so a hunt yields more than intended. If that's not wanted, have the wolf hunt deliver only the fire meat.
- **Monster/wolf counts and combat numbers** (spawn caps, HP, damage, ranges) are first-pass guesses in `config.ts` and will want playtesting.
- The desert is reachable at campfire level 50 but has no content, so unlocking it is currently an anticlimax.

### Next steps (in SPEC priority order; "basics first, then the rest")
1. **Sound (Feature 9):** footsteps/actions, forest ambience, and enemy audio cues — the largest missing basic.
2. **Three boss locations + rare drops (Feature 5):** tree spirit (sprint shoes, healing staff), cult camp (enchanted spear), spider nest (best armour).
3. **Desert biome content + snake king + venom (Feature 6):** give the level-50 unlock a payoff.
4. **Merchant every other day (Rule 3):** task-for-items trading.
5. **First-run tutorial (Screens):** guided intro to the core loop.
6. **Graphics pass (ROADMAP request):** the original author asked for an art-style pass — livestock readability, visible logs/material drops, and an overall vibe matching the game.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. One-time setup: repo Settings -> Pages -> Source: "GitHub Actions". `vite.config.ts` uses `base: './'` so it works under a repo sub-path.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code layout, conventions, how to extend.
- [docs/ROADMAP.md](docs/ROADMAP.md): what is done, what is next (ordered by SPEC priorities), open questions.

## Status

Phase 1 (Izzy): procedural island, regrowing forest, day/night, first/third-person controls, inventory + hotbar, chopping, item drops, campfire levelling and fuel, health/hunger bars, livestock, cooking, game-over/history.

Phase 2 (Meabh): night monsters, raids + difficulty + blood-moon boss, crafting table and recipes, metal ore + metal weapons, loot chests, tameable wolves, and the night-50 win screen.

Not yet started: sound, the three boss locations and their rare drops, desert gameplay + snake king, merchant, and the first-run tutorial. See [docs/ROADMAP.md](docs/ROADMAP.md).
