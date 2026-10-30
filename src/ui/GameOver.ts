import type { RunRecord } from '../core/History';

const CAUSES: Record<RunRecord['cause'], string> = {
  monster: 'You were killed.',
  starvation: 'You starved to death.',
};

/** Game-over screen (markup in index.html). */
export class GameOver {
  private readonly root = document.getElementById('gameover') as HTMLElement;
  private readonly cause = document.getElementById('go-cause') as HTMLElement;
  private readonly streak = document.getElementById('go-streak') as HTMLElement;
  private readonly best = document.getElementById('go-best') as HTMLElement;

  constructor(onRestart: () => void, onSave: () => void) {
    (document.getElementById('go-restart') as HTMLElement).addEventListener('click', onRestart);
    (document.getElementById('go-save') as HTMLElement).addEventListener('click', onSave);
  }

  show(run: RunRecord, bestStreak: number, newBest: boolean): void {
    const n = run.nights;
    this.cause.textContent = CAUSES[run.cause];
    this.streak.textContent = `You survived ${n} night${n === 1 ? '' : 's'} (reached day ${run.day}).`;
    this.best.textContent = newBest
      ? 'New best streak!'
      : `Best streak: ${bestStreak} night${bestStreak === 1 ? '' : 's'}`;
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.root.classList.add('hidden');
  }
}
