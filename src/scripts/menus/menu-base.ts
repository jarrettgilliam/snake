import { Drawable } from '../interfaces/drawable.ts';
import { CanvasLabel } from '../controls/canvas-label.ts';
import { CanvasButton } from '../controls/canvas-button.ts';
import { getKeyboardCode, KeyboardCode } from '../enums/keyboard-code.ts';
import { Game } from '../game.ts';
import { GameState } from '../enums/game-state.ts';
import { Point } from '../primitives/point.ts';
import { InputEvent } from '../events/input-event.ts';
import { toKeyboardCode } from '../enums/gamepad-buttons.ts';
import { isSnakeGamepadEvent } from '../events/snake-gamepad-event.ts';

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

    oninput(e: InputEvent) {
        this.handleTouchAndMouseInput(e);
        this.handleKeyboardAndGamepadInput(e);
    }

    private handleTouchAndMouseInput(e: InputEvent) {
        let touch: Point | undefined;
        let touchstart = false;

        if (e.type.startsWith('touch') && e instanceof TouchEvent) {
            touch = this.game.getTapPos(e.changedTouches[0]);
            touchstart = e.type === 'touchstart';
        } else if (e.type.startsWith('mouse') && e instanceof MouseEvent) {
            touch = this.game.getTapPos(e);
            touchstart = e.type === 'mousedown';
        } else {
            return;
        }

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

    private handleKeyboardAndGamepadInput(e: InputEvent) {
        let code: KeyboardCode | undefined;

        if (e.type === 'keydown' && e instanceof KeyboardEvent) {
            code = getKeyboardCode(e);
        } else if (e.type === 'buttondown' && isSnakeGamepadEvent(e)) {
            code = toKeyboardCode(e.button);
        } else {
            return;
        }

        if (code === KeyboardCode.Escape) {
            this.clearButtonIndex();
        } else if (code === KeyboardCode.Enter) {
            this.tryAcceptSelected();
        } else if (code === KeyboardCode.ArrowLeft ||
            code === KeyboardCode.A ||
            code === KeyboardCode.ArrowUp ||
            code === KeyboardCode.W) {
            this.buttonIndex--;
        } else if (code === KeyboardCode.ArrowRight ||
            code === KeyboardCode.D ||
            code === KeyboardCode.ArrowDown ||
            code === KeyboardCode.S) {
            this.buttonIndex++;
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
