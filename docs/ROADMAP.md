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

## Next (core loop)

1. Axe/tools (chopping currently bare-handed) via crafting
2. Crafting table + recipes (spear -> gun), metal ore mining
3. Monsters, night attacks every other night, difficulty +1 every 3 days, blood moon boss every 10 days
4. Win condition at night 50 (plane pickup), dedicated game history screen (the home/pause overlay already lists the last 8 runs)
5. Tutorial (first-run), full home screen
6. Merchant (every other day), random loot chests, wolf taming

## Later

Sound/ambience, three bosses, rare drops, desert biome + snake king, shadows, grass/props, visual cue for locked map edge.

## Open questions for the product owner

- Log requirement is capped at 500/level but total logs to reach level 50 are still ~14,000. Is that intended as a long-term goal, or should the curve/desert unlock change?
- Cooking tuning (8 s, 10 pieces at once, cooked = 35 hunger/+5 health vs raw 8) is my guess. Should raw meat have a downside?
- Fuel tuning (90 s per log, 10 min max) and the 20 m safe radius are my guesses.
- Livestock numbers/HP/drop amounts and the 90 s respawn are my guesses; bare-hand killing a cow takes 6 hits.
- Art direction: low-poly procedural (current) vs imported models?
- Monster/entity designs and what makes day feel "eerie" (ideas: silent animals, too-still wind, distant sounds).
