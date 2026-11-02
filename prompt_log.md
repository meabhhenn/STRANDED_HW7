# Prompt Log (Phase 2)

**Tool:** Kiro (agent mode)
**Model:** [the model Kiro showed]

## 1. Understand the codebase before changing anything
```
Read SPEC.md, docs/ARCHITECTURE.md and docs/ROADMAP.md, then the code in
src/. Explain how the code is structured, how Livestock and animals.ts work,
and which SPEC features are done, partly done, or missing. Note anywhere the
docs disagree with the code. Don't change anything.
```

## 2. Night monsters (SPEC Rule 2)
```
Add one night monster type, following the existing pattern in
entities/animals.ts and entities/Livestock.ts (same class structure and
naming style). Per docs/ARCHITECTURE.md "Extending":
- Spawn only when dayNight.isNight, outside the campfire safe zone
- Chase the player and deal damage with stats.damage(n, 'monster')
  (add the 'monster' DamageSource in Stats.ts if it's missing)
- Never enter the safe zone while world.isSafe() is true
- The player can hit it with the existing attack in Interaction.act()
- Put all tunables (speed, damage, HP, spawn count) in config.ts
Use simple placeholder geometry like the livestock. Don't rewrite or rename
any existing code; only add to it. Stop when done so I can test at
/?hour=22.
```

## 3. Crafting table and weapons (SPEC Feature 7)
```
Add a simple crafting system, following the existing patterns and the
ARCHITECTURE "Extending" table (new items = new ITEMS entries in
inventory/Item.ts with chopPower/damage/createHeldMesh).
- Add a crafting table the player can place or that sits near the campfire
- Standing at it and pressing C opens a small crafting menu (reuse the
  existing pixel-art UI style from index.html / ui/)
- Two recipes: wooden spear (logs) and stone/better axe or a club
  (logs + leather). The spear should have higher damage than the axe
  so monsters are easier to fight.
- Put recipe costs and weapon stats in config.ts
Don't rewrite or rename existing code; only add to it. Don't add ore
mining or guns yet. Stop when done so I can test.
```

## 4. Win condition (SPEC Rule 4)
```
Add the SPEC Rule 4 win condition: when the player survives to the start
of day 51 (after night 50), show a victory screen ("A plane spotted your
fire. You're rescued!") with nights survived, record the run in History
as a win, and offer Restart. Reuse the GameOver screen's structure and
style. Put the win night (50) in config.ts. Add a dev URL option like
?day=50 so it can be tested without playing 50 nights. Only add code;
don't rewrite existing code. Stop when done.
```

## 5. Fix: wins showing as deaths
```
In Overlay.renderHistory, show "Rescued" (instead of the cause) when a
run has won: true. Make that one small change only. Leave cause as is.
```

## 6. Raids, difficulty scaling, blood moon (SPEC Rule 2)
```
Extend the existing Monsters system (entities/Monsters.ts) to finish
SPEC Rule 2. Don't rewrite it; add to it.
- Every other night is a "raid night": monsters target the campfire,
  not just the player. While the fire is out (safe zone lost), they can
  come in and attack it, and it loses fuel when hit.
- Difficulty scales every 3 days: more monsters, more HP and damage.
  Put the scaling factors in config.ts.
- Every 10th night is a blood moon: tint the sky/fog red (via the
  existing DayNight/Sky code) and spawn one large boss monster (a scaled
  version of the existing stalker with much more HP and damage) that
  heads for the campfire.
- Show a HUD toast when a raid night or blood moon starts.
- Add dev URL options so these can be tested quickly (e.g. ?day=10&hour=22).
Only add code. Keep existing names and patterns. Stop when done.
```

## 7. Raid monsters attack the player
```
On raid nights and blood moons only, let monsters enter the campfire
safe zone and attack the player there (normal nights keep the current
safe-zone behavior). Raid monsters should target the player if within
range, otherwise head for the fire. Make that change in Monsters.ts only;
don't change anything else.
```

## 8. Loot chests (SPEC Feature 8)
```
Add random loot chests (SPEC Feature 8), following existing patterns.
- New items in inventory/Item.ts: bandage (heal 25) and medkit (heal 60),
  using the existing `heal` field so clicking with one selected uses it
  like food. Add icons in ui/icons.ts and simple meshes in render/props.ts.
- Scatter a few chests on forest ground at run start (seeded like the
  forest). Facing one and pressing E opens it: it drops 1-3 random loot
  piles (bandage, medkit, logs, leather, sometimes a wooden spear) via the
  existing DroppedItems system, then it shows as opened.
- Chests respawn in new spots after a while. Put counts, loot table and
  timers in config.ts.
Only add code; keep existing names and patterns. Stop when done.
```

## 9. Ore mining and metal weapons (SPEC Feature 7)
```
Finish SPEC Feature 7 by adding metal ore and metal weapons, extending
the existing crafting system (recipes.ts, CRAFT_COSTS in config.ts) and
following the Forest/Chests patterns. Don't rewrite existing code.
- Scatter ore rocks on forest ground (seeded). Clicking one with a tool
  selected mines it like chopping a tree: a few hits, drops 1-3 metal_ore,
  then the rock regrows after a while.
- New items: metal_ore, iron_spear (more damage than wooden spear), and a
  simple gun (highest damage, longer reach; no ammo system, just a
  slower attack cooldown). Icons in ui/icons.ts, meshes in render/props.ts.
- Add recipes to the crafting table: iron_spear (logs + ore), gun
  (more ore + leather).
- Put rock count, hits, drops, regrow time, weapon stats and costs in
  config.ts.
Only add code; keep existing names and patterns. Stop when done.
```

## 10. Tameable wolves (SPEC Feature 4)
```
Add tameable wolves (SPEC Feature 4), following the Livestock/Monsters
patterns (data + model in a kinds file, behavior in a class). Only add
code; keep existing names and patterns.
- A few wild wolves wander the forest. They don't attack unless hit.
- Clicking a wild wolf with raw_meat selected feeds it (uses 1 meat).
  After WOLF_TAME_MEAT feedings it becomes tamed (show a toast).
- Tamed wolves follow the player. At night they attack any monster near
  the player or the campfire. During the day they hunt livestock nearby
  and the meat drops at the campfire.
- Put counts, tame cost, speeds, damage and HP in config.ts.
Stop when done.
```

## When the AI did something I didn't want
- **Wins recorded as monster deaths.** When adding the win condition, the
  AI saved winning runs with `cause: 'monster'` to avoid changing a shared
  type, so wins showed up as "killed" in the history list. I sent prompt 5
  to have it show "Rescued" for won runs instead.
- **Inaccurate claim in its analysis.** In its first read of the codebase
  (prompt 1), the AI said it couldn't confirm the GitHub Pages deploy
  workflow existed. It does (.github/workflows/deploy.yml); the hidden
  folder just wasn't in what it read. I