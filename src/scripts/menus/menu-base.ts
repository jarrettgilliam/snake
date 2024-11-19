import { Drawable } from '../interfaces/drawable.ts';
import { getCode, getValueAsFunction } from '../utils.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { Keys } from '../enums/keys.ts';
import { Game } from '../game.ts';

export class MenuBase implements Drawable {
    protected readonly game: Game;
    private readonly nextGameState: () => number;
    private readonly acceptSelectedCallback: () => void;
    private readonly labels: CanvasLabel[];
    protected readonly buttons: CanvasButton[];

    constructor(game: Game, nextGameState: number | (() => number), acceptSelectedCallback: () => void, labels: CanvasLabel[], buttons: CanvasButton[]) {
        this.game = game;
        this.nextGameState = getValueAsFunction(nextGameState);
        this.acceptSelectedCallback = acceptSelectedCallback;
        this.labels = labels;
        this.buttons = buttons;
        this.resetButtonIndex();
    }

    get buttonIndex() {
        for (let i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].selected) {
                return i;
            }
        }
        return -1;
    }

    set buttonIndex(value) {
        if (value >= this.buttons.length) {
            value = 0;
        } else if (value < 0) {
            value = this.buttons.length - 1;
        }

        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].selected = (i === value);
        }
    }

    get defaultButtonIndex() {
        return 0;
    }

    resetButtonIndex() {
        this.buttonIndex = this.defaultButtonIndex;
    }

    clearButtonIndex() {
        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].selected = false;
        }
    }

    oninput(e: any) {

        // handle touch and mouse input
        let touch;
        let touchstart;

        if (e.type.startsWith('touch')) {
            touch = this.game.getTapPos(e.changedTouches[0]);
            touchstart = e.type === 'touchstart';
        } else if (e.type.startsWith('mouse')) {
            touch = this.game.getTapPos(e);
            touchstart = e.type === 'mousedown';
        }

        if (touch) {
            let found = false;
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].intersects(touch)) {
                    found = true;
                    if (touchstart) {
                        this.buttonIndex = i;
                    } else if (this.buttonIndex === i) {
                        this.acceptSelectedOption();
                    }
                    break;
                }
            }
            if (!found) {
                this.clearButtonIndex();
            }
        }

        // handle keyboard input
        if (e.type === 'keydown') {
            const code = getCode(e);
            if (code === Keys.Escape) {
                this.clearButtonIndex();
            } else if (code === Keys.Enter) {
                this.acceptSelectedOption();
            } else {
                if (code === Keys.ArrowLeft ||
                    code === Keys.A ||
                    code === Keys.ArrowUp ||
                    code === Keys.W) {
                    this.buttonIndex--;
                }
                else if (
                    code === Keys.ArrowRight ||
                    code === Keys.D ||
                    code === Keys.ArrowDown ||
                    code === Keys.S) {
                    this.buttonIndex++;
                }
            }
        }
    }

    acceptSelectedOption() {
        if (this.buttonIndex >= 0) {
            this.game.gameState = this.nextGameState();
            this.acceptSelectedCallback();
        }
    }

    draw() {
        for (const label of this.labels) {
            label.draw();
        }
        for (const button of this.buttons) {
            button.draw();
        }
    }
}
