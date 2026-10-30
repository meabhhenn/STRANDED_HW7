import '@fontsource/press-start-2p/400.css'; // pixel font, bundled by Vite (no network request)
import { Game } from './core/Game';

const container = document.getElementById('game');
if (!container) throw new Error('Missing #game container');

new Game(container).start();
