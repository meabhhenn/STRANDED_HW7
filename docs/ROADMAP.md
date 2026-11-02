# Roadmap

Order follows SPEC "Priorities": basic functions first (materials, crafting, weapons, hunger, health, monsters); sound, bosses, rare loot and desert last.

NOTE TO NEXT PERSON: Graphics need to be improved, the livestock do not look accurate right now and you can't see the logs and material drops look weird. Feel free to change the artstyle to match the vibes of the game more.

ACCESS CURRENT PROGRESS AT: https://izzyh-gif.github.io/Survival-Game/.

## Done

- [x] Vite + TypeScript + Three.js project, GitHub Pages deploy workflow
- [x] Procedural island (forest biome + beach + water), desert region defined but locked
- [x] Instanced forest with trunk collision
- [x] Placeholder campfire with light
- [x] Day/night cycle and day counter
- [x] First-person controls: W/S/arrows, A/D turn, mouse look, Shift sprint
- [x] Pause overlay with sensitivity setting (persisted)
- [x] First/third-person zoom with visible player model
- [x] Inventory (10 slots), hotbar HUD, Q drop / E pick up, item piles
- [x] Chop trees (5-10 logs each), trees regrow over time
- [x] Campfire log feeding and levelling (50 logs for level 1, +10 per level, capped at 500)
- [x] Campfire fuel burn-down, 10 s out-timer, safe zone flag (`World.isSafe`)
- [x] Health and hunger bars; sprint drains hunger; starvation drains health and slows; no natural regen; consumables heal/feed
- [x] Livestock (cow, sheep, chicken): wander, flee, melee, drops, respawn; raw meat/leather/wool/feather items
- [x] Cooking: drop raw meat in the lit fire -> cooked meat
- [x] Game-over screen (streak + best streak), Restart / Save progress, persisted run history, full run reset

### Phase 2 (Meabh Hennessy)

- [x] Tools via crafting: player starts with a wooden axe; stone axe craftable (chopping is no longer bare-handed only)
- [x] Crafting table + crafting menu (press C nearby) + recipes module; recipes: wooden spear, stone axe, iron spear, gun
- [x] Metal ore mining: ore rocks mined like trees (a few hits -> metal ore), regrow over time
- [x] Metal weapons: iron spear (strong melee) and gun (longest reach, highest damage, slower cooldown; no ammo system)
- [x] Monsters: stalker spawns at night outside the safe zone, chases the player, deals damage
- [x] Raids every other night (monsters target the campfire and drain its fuel once it is out), difficulty tiers every 3 days (count/HP/damage), blood moon every 10th night (red sky + scaled boss); HUD toasts announce the night
- [x] Win condition at night 50: rescue/victory screen, run recorded as a win, best streak persists
- [x] Random loot chests: seeded, open with E for 1-3 loot piles (bandage, medkit, logs, leather, sometimes a wooden spear), respawn elsewhere
- [x] Tameable wolves: wild wolves wander; feed raw meat to tame; tamed wolves follow, fight monsters near the player/fire at night, and hunt livestock by day (meat delivered to the fire)
- [x] Consumables: bandage (heal 25) and medkit (heal 60) using the existing click-to-use path

## Next (core loop)

1. Sound/ambience (Feature 9): footsteps, action sounds, forest background, enemy audio cues
2. Three boss locations + rare drops (Feature 5): tree spirit (sprint shoes, healing staff), cult camp (enchanted spear), spider nest (best armour)
3. Desert biome content + snake king + venom (Feature 6): give the level-50 unlock a payoff
4. Merchant every other day (Rule 3): task-for-items trading
5. First-run tutorial (Screens): guided intro to the core loop
6. Dedicated game-history screen (the home/pause overlay already lists the last 8 runs)

## Later

Shadows, grass/props, visual cue for the locked desert edge, art-style pass (see the note at the top).

## Open questions for the product owner

- Log requirement is capped at 500/level but total logs to reach level 50 are still ~14,000. Is that intended as a long-term goal, or should the curve/desert unlock change?
- Cooking tuning (8 s, 10 pieces at once, cooked = 35 hunger/+5 health vs raw 8) is my guess. Should raw meat have a downside?
- Fuel tuning (90 s per log, 10 min max) and the 20 m safe radius are my guesses.
- Livestock numbers/HP/drop amounts and the 90 s respawn are my guesses; bare-hand killing a cow takes 6 hits.
- Art direction: low-poly procedural (current) vs imported models?
- Monster/entity designs and what makes day feel "eerie" (ideas: silent animals, too-still wind, distant sounds).
- Phase 2: gun balance is a guess (no ammo system; only cost is a slower cooldown + ore recipe) — is it too strong once crafted?
- Phase 2: a tamed wolf's day-hunt currently drops the animal's normal loot at the corpse *and* delivers one raw meat to the fire (double drop). Keep, or deliver only the fire meat?
- Phase 2: monster/wolf counts, HP, damage and ranges are first-pass guesses in config.ts and want playtesting.
