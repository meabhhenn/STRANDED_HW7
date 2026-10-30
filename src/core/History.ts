import type { DamageSource } from '../player/Stats';

const STORAGE_KEY = 'stranded.history.v1';
const MAX_RUNS = 50;

/** One finished attempt. */
export interface RunRecord {
  /** ISO timestamp of when the run ended. */
  endedAt: string;
  /** Nights fully survived: the "streak" (SPEC rule 4). */
  nights: number;
  /** In-game day number reached. */
  day: number;
  cause: DamageSource;
}

/**
 * Persistent game history (localStorage). The best streak is the highest
 * `nights` across all stored runs. Feeds the game-over screen and the
 * "view game history" part of the home screen.
 */
class HistoryStore {
  private runs: RunRecord[] = [];

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.runs = JSON.parse(raw) as RunRecord[];
    } catch {
      this.runs = [];
    }
  }

  get all(): readonly RunRecord[] {
    return this.runs;
  }

  get bestStreak(): number {
    return this.runs.reduce((best, r) => Math.max(best, r.nights), 0);
  }

  /** Stores a finished run and returns true if it set a new best streak. */
  record(run: RunRecord): boolean {
    const isBest = run.nights > this.bestStreak;
    this.runs = [run, ...this.runs].slice(0, MAX_RUNS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.runs));
    } catch {
      /* storage unavailable: history just won't persist */
    }
    return isBest;
  }
}

export const history = new HistoryStore();
