import { DEFAULT_SENSITIVITY, DEFAULT_TRACKPAD_SENSITIVITY } from '../config';

const STORAGE_KEY = 'stranded.settings.v1';

interface SettingsData {
  /** Mouse / single-finger look multiplier (1 = default). */
  sensitivity: number;
  /** Two-finger trackpad look multiplier (1 = default). */
  trackpadSensitivity: number;
  /**
   * Flips two-finger look direction. Default matches "natural scrolling"
   * (swipe fingers up = look up, swipe right = turn right).
   */
  invertTrackpad: boolean;
}

const DEFAULTS: SettingsData = {
  sensitivity: DEFAULT_SENSITIVITY,
  trackpadSensitivity: DEFAULT_TRACKPAD_SENSITIVITY,
  invertTrackpad: false,
};

/**
 * User preferences persisted in localStorage. Add new settings by extending
 * SettingsData + DEFAULTS and `set()`; unknown/missing keys fall back to defaults.
 */
class SettingsStore {
  private data: SettingsData = { ...DEFAULTS };

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.data = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SettingsData>) };
    } catch {
      /* storage unavailable or corrupt: keep defaults */
    }
  }

  get sensitivity(): number {
    return this.data.sensitivity;
  }
  get trackpadSensitivity(): number {
    return this.data.trackpadSensitivity;
  }
  get invertTrackpad(): boolean {
    return this.data.invertTrackpad;
  }

  set<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.data[key] = value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  }
}

export const settings = new SettingsStore();
