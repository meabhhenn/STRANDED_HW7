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
} as const;

// ---- Win condition (SPEC rule 4: survive 50 nights, then rescued) ---------
/**
 * Nights the player must survive to win. The plane arrives at the start of the
 * next day (day WIN_NIGHT + 1), i.e. after surviving night WIN_NIGHT.
 */
export const WIN_NIGHT = 50;
