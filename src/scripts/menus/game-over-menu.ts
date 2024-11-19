import { MenuBase } from './menu-base.ts';
import { GameState } from '../enums/game-state.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { Game } from '../game.ts';

export class GameOverMenu extends MenuBase {

    constructor(game: Game) {
        super(game, GameState.StartMenu, () => this.resetButtonIndex(),
            [
                new CanvasLabel(game, "GAME OVER", 2, 7 / 16),
                new CanvasLabel(game, () => `DIFFICULTY: ${game.difficulty}`, 0.7, 35 / 64),
                new CanvasLabel(game, () => `YOUR SCORE: ${game.score}`, 0.7, 39 / 64)
            ],
            [
                new CanvasButton(game, "Start_Over", 0.8, 22 / 32)
            ]);
    }
}
