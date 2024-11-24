import { MenuBase } from './menu-base.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { GameState } from '../enums/game-state.ts';
import { Game } from '../game.ts';

export class PauseMenu extends MenuBase<GameState> {

    constructor(game: Game) {
        super(game,
            [
                new CanvasLabel(game, "PAUSED", 2, 7 / 16),
                new CanvasLabel(game, () => `DIFFICULTY: ${game.difficulty}`, 0.7, 35 / 64),
                new CanvasLabel(game, () => `YOUR SCORE: ${game.score}`, 0.7, 39 / 64)
            ],
            [
                new CanvasButton(game, "Resume", 0.8, 22 / 32, GameState.Playing),
                new CanvasButton(game, "Start_Over", 0.8, 22 / 32 + 1 / 12, GameState.StartMenu)
            ]);
    }

    acceptSelected(buttonData: GameState): GameState {
        this.unpause();
        return buttonData;
    }

    unpause() {
        this.game.removeSave();
        this.resetButtonIndex();
    }
}
