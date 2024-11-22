import { MenuBase } from './menu-base.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { DefaultDifficulty, Difficulty } from '../enums/difficulty.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { GameState } from '../enums/game-state.ts';
import { Game } from '../game.ts';

export class StartMenu extends MenuBase {

    constructor(game: Game) {
        const labels = [
            new CanvasLabel(game, "SNAKE", 3, 1 / 3),
            new CanvasLabel(game, "CHOOSE YOUR DIFFICULTY", 0.6, 13 / 32)
        ];

        const buttons: CanvasButton[] = [];
        Object.keys(Difficulty).forEach((key, index) => {
            buttons.push(new CanvasButton(game, key, 0.8, 15 / 32 + index / 12));
        });

        super(game, GameState.Playing, () => this.setupGame(), labels, buttons);
    }

    get defaultButtonIndex() {
        return this.buttons.findIndex(b => b.text() === DefaultDifficulty);
    }

    setupGame() {
        this.game.reset();
        this.game.difficulty = this.buttons[this.buttonIndex].text() as Difficulty;
    }
}
