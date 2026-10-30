import type { RunRecord } from '../core/History';

/**
 * Victory screen (SPEC rule 4): shown when the player survives to the rescue.
 * Mirrors the GameOver screen's structure and style (markup in index.html),
 * but celebrates the win and only offers Restart.
 */
export class Victory {
  private readonly root = document.getElementById('victory') as HTMLElement;
  private readonly cause = document.getElementById('win-cause') as HTMLElement;
  private readonly streak = document.getElementById('win-streak') as HTMLElement;
  private readonly best = document.getElementById('win-best') as HTMLElement;

  constructor(onRestart: () => void) {
    (document.getElementById('win-restart') as HTMLElement).addEventListener('click', onRestart);
  }

  show(run: RunRecord, bestStreak: number, newBest: boolean): void {
    const n = run.nights;
    this.cause.textContent = 'A plane spotted your fire. You\u2019re rescued!';
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
