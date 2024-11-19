import { Game } from './game.ts';
import { throwIfNull } from './utils.ts';

let localStorage: Storage | null = null;
try {
    localStorage = window.localStorage;
} catch (err: any) {
    console.error(err);
}

const canvas = throwIfNull(document.getElementById("canvas") as HTMLCanvasElement);
const game = new Game(canvas, localStorage);

if (document.fonts?.load) {
    document.fonts.load('10pt "Press Start 2P"').then(() => game.start());
} else {
    game.start();
}
