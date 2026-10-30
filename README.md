# STRANDED

A 3D island survival game: survive 50 nights after a plane crash. Built with TypeScript, Three.js and Vite. The full design is in [SPEC.md](SPEC.md). Current progress and future steps is described in [ROADMAP.md](ROADMAP.md).

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
| Shift | Sprint |
| Numpad + / Numpad - (or `=` / `-`) | Zoom camera in / out: fully in = first person, out = third person |
| Click (hold) | Swing at the animal / tree in front; with logs selected near the fire, add a log; with food selected, eat |
| E | Pick up the nearest dropped item |
| Q / Shift+Q | Drop one item / the whole stack |
| 1-9, 0 or mouse wheel | Select inventory slot |
| Esc | Pause (overlay with sensitivity slider) |

Gameplay so far: chop trees for 5-10 logs each (you start with a wooden axe: 3 hits; bare hands take 5), pick the logs up, and feed the campfire. Logs count toward the fire's level (50 for level 1, +10 per level, capped at 500) and also burn as fuel (90 s per log). If the fire is out for 10 s the safe zone is lost until you add a log. Hunger drains over time (3x while sprinting); at 0 you can't sprint, move slower, and lose health (0.5/s). Health never regenerates; it only comes back from eating or healing items (bandage, medkit, staff). When you die, a game-over screen shows your streak (nights survived) and the best streak; choose Restart or Save progress (returns to the home screen). Felled trees grow back after 2 minutes. Cows, sheep and chickens roam the forest: hit them (bare hands for now) for raw meat plus leather, wool or feathers. They flee when hit and respawn after 90 s. Raw meat restores 8 hunger. Stand by the lit fire, face it and press Q to drop raw meat in: it cooks for 8 s and cooked meat (35 hunger, +5 health) appears beside the fire for you to pick up with E.

Dev console (`npm run dev` only): `__stranded.stats.damage(30)`, `__stranded.inventory.add('log', 50)`, `__stranded.world.campfireLevel = 5`.

Dev tip: open `/?hour=22` to start at 10pm and inspect the night look.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. One-time setup: repo Settings -> Pages -> Source: "GitHub Actions". `vite.config.ts` uses `base: './'` so it works under a repo sub-path.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code layout, conventions, how to extend.
- [docs/ROADMAP.md](docs/ROADMAP.md): what is done, what is next (ordered by SPEC priorities), open questions.

## Status

Done: procedural island, regrowing forest, day/night, first/third-person controls, inventory + hotbar, chopping, item drops, campfire levelling and fuel, health/hunger bars. See the roadmap for next steps.
