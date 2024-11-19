import { MenuBase } from './menu-base.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { GameState } from '../enums/game-state.ts';
import { Game } from '../game.ts';

export class PauseMenu extends MenuBase {

    constructor(game: Game) {
        super(game, () => this.getNextGameState(), () => this.onUnpause(),
            [
                new CanvasLabel(game, "PAUSED", 2, 7 / 16),
                new CanvasLabel(game, () => `DIFFICULTY: ${game.difficulty}`, 0.7, 35 / 64),
                new CanvasLabel(game, () => `YOUR SCORE: ${game.score}`, 0.7, 39 / 64)
            ],
            [
                new CanvasButton(game, "Resume", 0.8, 22 / 32),
                new CanvasButton(game, "Start_Over", 0.8, 22 / 32 + 1 / 12)
            ]);
    }

    getNextGameState() {
        if (this.buttonIndex === 0) {
            return GameState.Playing;
        } else {
            return GameState.StartMenu;
        }
    }

    onUnpause() {
        this.game.removeSave();
        this.resetButtonIndex();
    }
}
