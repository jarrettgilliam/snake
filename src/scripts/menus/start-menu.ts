import { MenuBase } from './menu-base.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { Difficulty } from '../enums/difficulty.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { GameState } from '../enums/game-state.ts';
import { Game } from '../game.ts';
import { InitialState, SaveData } from '../interfaces/save-data.ts';

export class StartMenu extends MenuBase<Difficulty> {

    constructor(game: Game) {
        const labels = [
            new CanvasLabel(game, "SNAKE", 3, 1 / 3),
            new CanvasLabel(game, "CHOOSE YOUR DIFFICULTY", 0.6, 13 / 32)
        ];

        const buttons: CanvasButton<Difficulty>[] = [];
        Object.keys(Difficulty).forEach((key, index) => {
            buttons.push(new CanvasButton(game, key, 0.8, 15 / 32 + index / 12, key as Difficulty));
        });

        super(game, labels, buttons);
    }

    get defaultButtonIndex() {
        return this.buttons.findIndex(b => b.text() === this.game.difficulty);
    }

    acceptSelected(buttonData: Difficulty): GameState {
        const data: SaveData = {
            ...InitialState,
            difficulty: buttonData
        }

        this.game.reset(data);

        return GameState.Playing;
    }
}
