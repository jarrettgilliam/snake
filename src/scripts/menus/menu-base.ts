import { Drawable } from '../interfaces/drawable.ts';
import { getCode } from '../utils.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { Keys } from '../enums/keys.ts';
import { Game } from '../game.ts';
import { GameState } from '../enums/game-state.ts';
import { Point } from '../primitives/point.ts';

export abstract class MenuBase<T> implements Drawable {
    protected readonly game: Game;
    private readonly labels: CanvasLabel[];
    protected readonly buttons: CanvasButton<T>[];

    protected constructor(game: Game,
                          labels: CanvasLabel[],
                          buttons: CanvasButton<T>[]) {
        this.game = game;
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
        this.handleTouchAndMouseInput(e);
        this.handleKeyboardInput(e);
    }

    private handleTouchAndMouseInput(e: any) {
        let touch: Point | undefined;
        let touchstart = false;

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
                        this.tryAcceptSelected();
                    }
                    break;
                }
            }
            if (!found) {
                this.clearButtonIndex();
            }
        }
    }

    private handleKeyboardInput(e: any) {
        if (e.type === 'keydown') {
            const code = getCode(e);
            if (code === Keys.Escape) {
                this.clearButtonIndex();
            } else if (code === Keys.Enter) {
                this.tryAcceptSelected();
            } else {
                if (code === Keys.ArrowLeft ||
                    code === Keys.A ||
                    code === Keys.ArrowUp ||
                    code === Keys.W) {
                    this.buttonIndex--;
                } else if (
                    code === Keys.ArrowRight ||
                    code === Keys.D ||
                    code === Keys.ArrowDown ||
                    code === Keys.S) {
                    this.buttonIndex++;
                }
            }
        }
    }

    tryAcceptSelected() {
        if (this.buttonIndex >= 0 && this.buttonIndex < this.buttons.length) {
            this.game.gameState = this.acceptSelected(this.buttons[this.buttonIndex].data);
        }
    }

    /**
     * Accept the selected button and return the new game state.
     * @param buttonData - The data associated with the selected button.
     */
    abstract acceptSelected(buttonData: T): GameState;

    draw() {
        this.labels.forEach(l => l.draw());
        this.buttons.forEach(b => b.draw());
    }
}
