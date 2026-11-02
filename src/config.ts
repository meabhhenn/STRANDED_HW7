/**
 * Central tuning values. Put gameplay/world constants here (not inline in
 * classes) so the next developer can balance the game from one place.
 * Units: metres, seconds, radians unless noted.
 */

// ---- World ----------------------------------------------------------------
export const WORLD_SEED = 1337;
/** Side length of the square terrain mesh. Island sits in the middle. */
export const TERRAIN_SIZE = 500;
/** Grid cells per side of the terrain mesh (cell = TERRAIN_SIZE / this). */
export const TERRAIN_SEGMENTS = 250;
/** Nominal island radius; the coast is noisy around this. */
export const ISLAND_RADIUS = 150;
export const WATER_LEVEL = 0;
/** Ground below this height is too deep/wet to walk on. */
export const MIN_WALK_HEIGHT = 0.15;
/** Campfire is placed at world origin on flat ground of this height. */
export const CAMPFIRE_GROUND_HEIGHT = 3;
export const CAMPFIRE_FLAT_RADIUS = 7;
export const CAMPFIRE_BLEND_RADIUS = 16;

// ---- Map unlocking (SPEC: campfire level unlocks more of the map) ---------
/** Forest radius walkable at campfire level 1. */
export const BASE_UNLOCK_RADIUS = 45;
/** Extra radius unlocked per campfire level. */
export const UNLOCK_RADIUS_PER_LEVEL = 7;
/** Campfire level at which the desert biome becomes accessible. */
export const DESERT_UNLOCK_LEVEL = 50;
/** Desert sits where (z + noise) is below this value (i.e. north of camp). */
export const DESERT_START_Z = -70;

// ---- Forest ---------------------------------------------------------------
export const TREE_ATTEMPTS = 2500;
export const TREE_MIN_SPACING = 3.2;
export const TREE_CLEARING_RADIUS = 12; // no trees this close to campfire
export const TREE_MIN_HEIGHT = 1.0; // keep trees off the beach

// ---- Time of day ----------------------------------------------------------
/** Real seconds for one full 24h in-game day. */
export const DAY_LENGTH_SECONDS = 600;
export const START_HOUR = 8;

// ---- Player ---------------------------------------------------------------
export const PLAYER_RADIUS = 0.4;
export const EYE_HEIGHT = 1.7;
export const WALK_SPEED = 4;
export const SPRINT_MULTIPLIER = 1.7;
export const BACKWARD_MULTIPLIER = 0.6;
/** Keyboard turning speed (A/D, Left/Right) in radians per second. */
export const KEY_TURN_SPEED = 1.9;
/** Radians of rotation per pixel at sensitivity 1.0. */
export const MOUSE_RADIANS_PER_PIXEL = 0.0022;
export const DEFAULT_SENSITIVITY = 1;
/** Radians of rotation per scroll pixel for two-finger trackpad look, at sensitivity 1. */
export const TRACKPAD_RADIANS_PER_PIXEL = 0.004;
export const DEFAULT_TRACKPAD_SENSITIVITY = 1;
/** Metres of camera zoom per pinch-gesture pixel (trackpad pinch = zoom). */
export const PINCH_ZOOM_PER_PIXEL = 0.06;

// ---- Camera (first <-> third person zoom) ---------------------------------
/** Max camera distance behind the player. 0 = first person. */
export const MAX_ZOOM_DISTANCE = 8;
/** Distance a single tap of a zoom key jumps to when leaving first person. */
export const ZOOM_TAP_DISTANCE = 3;
export const ZOOM_TAP_STEP = 1.5;
/** Metres per second while a zoom key is held. */
export const ZOOM_HOLD_SPEED = 4;
/** Below this camera distance the player body is hidden (first person). */
export const FIRST_PERSON_THRESHOLD = 0.5;

// ---- Inventory ------------------------------------------------------------
/** Number of inventory slots; all of them are shown in the hotbar (keys 1-9, 0). */
export const INVENTORY_SLOTS = 10;

// ---- Interaction ----------------------------------------------------------
/** Max centre-to-centre distance to a tree/campfire the player can act on. */
export const REACH_DISTANCE = 2.8;
/** Max distance to pick up a dropped item pile with E. */
export const PICKUP_DISTANCE = 2.5;
/** Min dot(facing, direction-to-target); ~0.8 is a cone of about +/-37 degrees. */
export const AIM_MIN_DOT = 0.8;
/** How far in front of the player Q drops items. */
export const DROP_DISTANCE = 1.3;
export const CHOP_COOLDOWN = 0.55;
export const FEED_COOLDOWN = 0.15;

// ---- Trees & logs ---------------------------------------------------------
/** Tree hit points. Bare hands do PUNCH_CHOP_POWER per hit, tools their `chopPower`. */
export const TREE_HITS = 5;
/** Tree damage per hit without a tool. */
export const PUNCH_CHOP_POWER = 1;
export const LOGS_PER_TREE_MIN = 5;
export const LOGS_PER_TREE_MAX = 10;
/** Seconds after felling before a tree starts growing back. */
export const TREE_REGROW_SECONDS = 120;
/** Seconds a regrowing tree takes to reach full size. */
export const TREE_GROW_SECONDS = 20;
/** A tree will not regrow while the player is closer than this (metres). */
export const TREE_REGROW_CLEARANCE = 2.5;

// ---- Campfire levelling ---------------------------------------------------
/** Logs needed to complete level 1. */
export const CAMPFIRE_LEVEL1_LOGS = 50;
/** Extra logs required for each later level (level N needs 50 + 10*(N-1)). */
export const CAMPFIRE_LOGS_INCREMENT = 10;
/** Upper limit on logs needed for any single level. */
export const CAMPFIRE_MAX_LOGS_PER_LEVEL = 500;
/** Logs needed to finish `level` and advance to the next (capped). */
export const logsRequiredForLevel = (level: number): number =>
  Math.min(CAMPFIRE_MAX_LOGS_PER_LEVEL, CAMPFIRE_LEVEL1_LOGS + (Math.max(1, level) - 1) * CAMPFIRE_LOGS_INCREMENT);

// ---- Campfire fuel & safe zone (SPEC rule 1) ------------------------------
/** Seconds of burn time one log adds. */
export const CAMPFIRE_LOG_BURN_SECONDS = 90;
export const CAMPFIRE_MAX_FUEL_SECONDS = 600;
export const CAMPFIRE_START_FUEL_SECONDS = 300;
/** Warn the player when fuel drops below this many seconds. */
export const CAMPFIRE_LOW_FUEL_SECONDS = 45;
/** Seconds the fire may be out before the safe zone disappears. */
export const CAMPFIRE_OUT_GRACE_SECONDS = 10;
/** Radius (metres) around the fire that is safe while the safe zone is active. */
export const CAMPFIRE_SAFE_RADIUS = 20;

// ---- Survival stats -------------------------------------------------------
export const MAX_HEALTH = 100;
export const MAX_HUNGER = 100;
/** Hunger lost per second while awake (100 -> 0 in ~17 min, under 2 in-game days). */
export const HUNGER_DRAIN_PER_SECOND = 0.1;
/** Drain multiplier while sprinting (SPEC: hunger drops faster when sprinting). */
export const HUNGER_SPRINT_MULTIPLIER = 3;
/** At 0 hunger the player can't sprint and moves at this fraction of speed. */
export const STARVING_SPEED_MULTIPLIER = 0.7;

/** Minimum seconds between eating actions. */
export const EAT_COOLDOWN = 0.8;

/** Health lost per second once hunger is at 0 (SPEC: empty hunger hurts health). */
export const STARVATION_DAMAGE_PER_SECOND = 0.5;

// ---- Livestock & combat ---------------------------------------------------
/** Damage per hit with bare hands (items can override via ItemDef.damage). */
export const PUNCH_DAMAGE = 1;
export const ATTACK_COOLDOWN = 0.45;
/** Reach/aim for attacking animals (a bit more forgiving: they move). */
export const ANIMAL_REACH = 3.2;
export const ANIMAL_AIM_MIN_DOT = 0.7;
/** How many of each animal the forest should hold. Killed ones respawn. */
export const LIVESTOCK_COUNTS = { cow: 6, sheep: 8, chicken: 10 } as const;
export const LIVESTOCK_RESPAWN_SECONDS = 90;
/** Animals only respawn at least this far from the player (metres). */
export const LIVESTOCK_RESPAWN_MIN_DISTANCE = 35;
/** Seconds an animal runs away after being hit. */
export const ANIMAL_FLEE_SECONDS = 4;

// ---- Cooking (SPEC: drop raw meat in the fire to cook it) -----------------
/** Seconds a batch of raw meat takes to cook. The fire must stay lit. */
export const COOK_SECONDS = 8;
/** Max pieces of meat that can cook at the same time. */
export const COOK_CAPACITY = 10;
/** A dropped item lands "in the fire" if the drop point is this close to its centre. */
export const COOK_DROP_RADIUS = 1.8;

// ---- Art style (retro low-poly + pixel art) -------------------------------
/** The 3D scene is rendered at this vertical resolution, then scaled up with sharp pixels. */
export const PIXEL_RENDER_HEIGHT = 270;
/** Colour steps per channel after quantising (lower = fewer colours, more retro). */
export const PALETTE_LEVELS = 9;

// ---- Night monsters (SPEC rule 2 / ARCHITECTURE "Extending": hostile mobs) -
/** HP of a night monster. Player fists do PUNCH_DAMAGE (1), the axe 2. */
export const MONSTER_HP = 6;
/** Collision radius (metres). */
export const MONSTER_RADIUS = 0.5;
/** Chase speed while hunting the player (metres/second). */
export const MONSTER_CHASE_SPEED = 2.6;
/** Wander speed while the player is out of detection range. */
export const MONSTER_WANDER_SPEED = 1.1;
/** The monster notices and starts chasing the player within this distance. */
export const MONSTER_DETECT_RANGE = 28;
/** Centre-to-centre distance at which the monster can land a hit. */
export const MONSTER_ATTACK_RANGE = 1.6;
/** Damage per successful hit on the player. */
export const MONSTER_ATTACK_DAMAGE = 8;
/** Minimum seconds between a monster's attacks. */
export const MONSTER_ATTACK_COOLDOWN = 1.2;
/** How many monsters to keep alive at once during the night. */
export const MONSTER_MAX_ALIVE = 6;
/** Seconds between spawn attempts while below the cap at night. */
export const MONSTER_SPAWN_INTERVAL = 6;
/** Monsters spawn at least / at most this far from the player (metres). */
export const MONSTER_SPAWN_MIN_DISTANCE = 22;
export const MONSTER_SPAWN_MAX_DISTANCE = 45;
/** Seconds an animal runs away is to flee; monsters instead keep a flee-less chase.
 *  A monster caught inside the safe zone retreats at this speed to the edge. */
export const MONSTER_RETREAT_SPEED = 3.4;
/** Seconds of hit squash animation. */
export const MONSTER_HURT_TIME = 0.25;
/** Seconds the death animation plays before the body is removed. */
export const MONSTER_DEATH_TIME = 0.8;

// ---- Crafting (SPEC feature 7: craft weapons from gathered materials) ------
/** How close (metres, centre-to-centre) the player must be to the table to craft. */
export const CRAFT_TABLE_REACH = 3.2;
/** Where the crafting table sits relative to the campfire at the origin. */
export const CRAFT_TABLE_X = 3.5;
export const CRAFT_TABLE_Z = 2.5;
/** Collision radius of the crafting table (metres). */
export const CRAFT_TABLE_RADIUS = 0.8;

// Weapon stats for crafted gear. Fists are PUNCH_DAMAGE (1); the starting
// wooden axe is damage 2 / chopPower 2. Crafted weapons beat those.
/** Wooden spear: a dedicated weapon. Highest damage so monsters are easier to fight. */
export const SPEAR_DAMAGE = 5;
/** The spear can still chop, but poorly (it's a weapon, not a tool). */
export const SPEAR_CHOP_POWER = 1;
/** Stone axe: a better tool than the wooden axe, and a decent weapon. */
export const STONE_AXE_DAMAGE = 3;
export const STONE_AXE_CHOP_POWER = 3;

/**
 * Recipe costs, keyed by the crafted item id. Each entry lists the item ids and
 * counts consumed from the inventory. Add new recipes here and in CRAFTING_RECIPES.
 */
export const CRAFT_COSTS = {
  wooden_spear: [{ item: 'log', count: 3 }],
  stone_axe: [
    { item: 'log', count: 3 },
    { item: 'leather', count: 2 },
  ],
  // SPEC feature 7: metal weapons, mined from ore and crafted at the table.
  iron_spear: [
    { item: 'log', count: 2 },
    { item: 'metal_ore', count: 3 },
  ],
  gun: [
    { item: 'metal_ore', count: 6 },
    { item: 'leather', count: 2 },
  ],
} as const;

// ---- Win condition (SPEC rule 4: survive 50 nights, then rescued) ---------
/**
 * Nights the player must survive to win. The plane arrives at the start of the
 * next day (day WIN_NIGHT + 1), i.e. after surviving night WIN_NIGHT.
 */
export const WIN_NIGHT = 50;

// ---- Night raids, difficulty & blood moon (SPEC rule 2) -------------------
/**
 * Raids happen every other night. Night N is a raid night when
 * N % RAID_EVERY_N_NIGHTS === 0 (N = day number at the start of that night).
 * On a raid night monsters target the campfire, not just the player.
 */
export const RAID_EVERY_N_NIGHTS = 2;
/** Every 10th night is a blood moon (overrides a plain raid and spawns a boss). */
export const BLOOD_MOON_EVERY_N_NIGHTS = 10;

/** Difficulty increases one "tier" every this many days. Tier = floor((day-1)/this). */
export const DIFFICULTY_EVERY_N_DAYS = 3;
/** Extra simultaneous monsters allowed per difficulty tier (added to MONSTER_MAX_ALIVE). */
export const DIFFICULTY_EXTRA_MONSTERS_PER_TIER = 2;
/** Monster HP multiplier added per difficulty tier (tier 2 => x1.5 at 0.25). */
export const DIFFICULTY_HP_PER_TIER = 0.25;
/** Monster damage multiplier added per difficulty tier. */
export const DIFFICULTY_DAMAGE_PER_TIER = 0.2;
/** Upper bound on difficulty tier so late-game stays playable. */
export const DIFFICULTY_MAX_TIER = 12;

/** Faster spawn cadence during a raid night (seconds between spawn attempts). */
export const RAID_SPAWN_INTERVAL = 3;
/** Extra simultaneous monsters allowed during a raid (on top of difficulty). */
export const RAID_EXTRA_MONSTERS = 3;

// ---- Campfire under attack ------------------------------------------------
/** Centre-to-centre distance at which a monster can hit the campfire. */
export const CAMPFIRE_ATTACK_RANGE = 1.8;
/** Fuel (seconds) the campfire loses per monster hit. */
export const CAMPFIRE_FUEL_LOSS_PER_HIT = 20;
/** Seconds between a monster's hits on the campfire. */
export const CAMPFIRE_ATTACK_COOLDOWN = 1.2;

// ---- Blood moon boss (a scaled-up stalker) --------------------------------
export const BOSS_HP = 120;
export const BOSS_RADIUS = 1.4;
/** Visual/▲ scale of the boss model relative to a normal stalker. */
export const BOSS_SCALE = 2.6;
export const BOSS_CHASE_SPEED = 2.2;
export const BOSS_ATTACK_DAMAGE = 22;
export const BOSS_ATTACK_COOLDOWN = 1.6;
/** Fuel (seconds) the campfire loses per boss hit (bosses wreck the fire). */
export const BOSS_CAMPFIRE_FUEL_LOSS_PER_HIT = 60;

// ---- Loot chests (SPEC feature 8: random chests with survival loot) -------
/** How many chests exist in the forest at once. Looted ones respawn elsewhere. */
export const CHEST_COUNT = 6;
/** Max centre-to-centre distance to open a chest with E, and aim cone. */
export const CHEST_REACH = 2.6;
export const CHEST_AIM_MIN_DOT = 0.5;
/** Each opened chest drops between this many loot piles. */
export const CHEST_MIN_DROPS = 1;
export const CHEST_MAX_DROPS = 3;
/** Seconds after a chest is looted before it reappears in a new spot. */
export const CHEST_RESPAWN_SECONDS = 150;
/**
 * Loot table. Each opened chest rolls CHEST_MIN_DROPS..CHEST_MAX_DROPS entries
 * from this list (weighted by `weight`), dropping `min..max` of the item each.
 * `wooden_spear` is rare, so it shows up only "sometimes".
 */
export const CHEST_LOOT = [
  { item: 'bandage', min: 1, max: 3, weight: 5 },
  { item: 'medkit', min: 1, max: 1, weight: 2 },
  { item: 'log', min: 3, max: 8, weight: 5 },
  { item: 'leather', min: 1, max: 3, weight: 4 },
  { item: 'wooden_spear', min: 1, max: 1, weight: 1 },
] as const;

// ---- Metal ore rocks (SPEC feature 7: mine ore to craft metal weapons) ----
/** How many ore rocks exist in the forest at once. Mined ones regrow in place. */
export const ROCK_COUNT = 14;
/** Hit points of an ore rock. A tool's `chopPower` mines it (bare hands = PUNCH_CHOP_POWER). */
export const ROCK_HITS = 4;
/** Metal ore dropped when a rock is mined out. */
export const ROCK_ORE_MIN = 1;
export const ROCK_ORE_MAX = 3;
/** Seconds after a rock is mined before it regrows in the same spot. */
export const ROCK_REGROW_SECONDS = 90;
/** Seconds a regrowing rock takes to scale back to full size. */
export const ROCK_GROW_SECONDS = 6;
/** Collision radius of an ore rock (metres). */
export const ROCK_RADIUS = 0.7;
/** A rock will not regrow while the player is closer than this (metres). */
export const ROCK_REGROW_CLEARANCE = 2.2;
/** Max centre-to-centre distance to mine a rock, and the aim cone. */
export const ROCK_REACH = 2.8;
export const ROCK_AIM_MIN_DOT = 0.75;

// ---- Metal weapons (crafted from ore) -------------------------------------
/** Iron spear: a stronger spear (beats the wooden spear's SPEAR_DAMAGE 5). */
export const IRON_SPEAR_DAMAGE = 8;
export const IRON_SPEAR_CHOP_POWER = 1;
/** Gun: highest damage, longer reach, but a slower attack cooldown (no ammo system). */
export const GUN_DAMAGE = 14;
/** Reach (metres) when attacking with the gun; longer than melee ANIMAL_REACH. */
export const GUN_REACH = 9;
/** Seconds between gun shots (slower than the melee ATTACK_COOLDOWN). */
export const GUN_ATTACK_COOLDOWN = 1.1;

// ---- Wolves (SPEC feature 4: tameable wolves that help the player) --------
/** How many wild wolves roam the forest at once. */
export const WOLF_COUNT = 4;
/** Collision radius of a wolf (metres). */
export const WOLF_RADIUS = 0.4;
/** Wolf hit points (the player can still kill one if attacked). */
export const WOLF_HP = 8;
/** Raw-meat feedings needed to tame a wild wolf. */
export const WOLF_TAME_MEAT = 3;
/** Speeds (metres/second). */
export const WOLF_WANDER_SPEED = 1.3;
export const WOLF_FOLLOW_SPEED = 4.2;
export const WOLF_CHASE_SPEED = 4.6;
/** A tamed wolf keeps roughly this far from the player while following (metres). */
export const WOLF_FOLLOW_DISTANCE = 3.5;
/** A tamed wolf won't stray farther than this from the player before returning. */
export const WOLF_LEASH_DISTANCE = 26;
/** Combat: reach to land a hit, damage per hit, seconds between hits. */
export const WOLF_ATTACK_RANGE = 1.6;
export const WOLF_ATTACK_DAMAGE = 4;
export const WOLF_ATTACK_COOLDOWN = 0.8;
/** A tamed wolf looks this far around the player/fire for monsters to fight at night. */
export const WOLF_DEFEND_RANGE = 22;
/** A tamed wolf looks this far around itself for livestock to hunt by day. */
export const WOLF_HUNT_RANGE = 30;
/** Seconds of hit squash / death animation. */
export const WOLF_HURT_TIME = 0.25;
export const WOLF_DEATH_TIME = 0.8;
