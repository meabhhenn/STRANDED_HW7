import { history, type RunRecord } from '../core/History';
import { settings } from '../core/Settings';

/**
 * Start / pause overlay (static markup lives in index.html). This is the seed
 * of the home screen; settings, game history and the tutorial will hang off it.
 */
export class Overlay {
  private readonly root = document.getElementById('overlay') as HTMLElement;
  private readonly crosshair = document.getElementById('crosshair') as HTMLElement;
  private readonly button = document.getElementById('resume') as HTMLButtonElement;
  private readonly best = document.getElementById('best-streak') as HTMLElement;
  private readonly historyEl = document.getElementById('history-list') as HTMLElement;
  private readonly slider = document.getElementById('sensitivity') as HTMLInputElement;

  constructor(onResume: () => void) {
    this.slider.value = String(settings.sensitivity);
    this.slider.addEventListener('input', () => settings.set('sensitivity', Number(this.slider.value)));

    const tp = document.getElementById('trackpad-sensitivity') as HTMLInputElement;
    tp.value = String(settings.trackpadSensitivity);
    tp.addEventListener('input', () => settings.set('trackpadSensitivity', Number(tp.value)));
    const invert = document.getElementById('invert-trackpad') as HTMLInputElement;
    invert.checked = settings.invertTrackpad;
    invert.addEventListener('change', () => settings.set('invertTrackpad', invert.checked));
    this.root.addEventListener('click', (e) => {
      // Clicking the panel (e.g. the slider) must not resume; the button or backdrop does.
      if (e.target === this.root || e.target === this.button) onResume();
    });
  }

  /** `label` is the button text, e.g. 'Click to play' / 'Click to resume' / 'New game'. */
  show(label: string): void {
    const bestStreak = history.bestStreak;
    this.button.textContent = label;
    this.renderHistory(history.all);
    this.best.textContent = bestStreak > 0 ? `Best streak: ${bestStreak} night${bestStreak === 1 ? '' : 's'}` : '';
    this.root.classList.remove('hidden');
    this.crosshair.classList.add('hidden');
  }

  /** Lists the most recent runs (newest first). */
  private renderHistory(runs: readonly RunRecord[]): void {
    this.historyEl.replaceChildren();
    runs.slice(0, 8).forEach((r) => {
      const li = document.createElement('li');
      const cause = r.cause === 'starvation' ? 'starved' : 'killed';
      li.textContent = `${r.nights} night${r.nights === 1 ? '' : 's'} (day ${r.day}), ${cause}, ${new Date(r.endedAt).toLocaleDateString()}`;
      this.historyEl.appendChild(li);
    });
  }

  hide(): void {
    this.root.classList.add('hidden');
    this.crosshair.classList.remove('hidden');
  }
}
