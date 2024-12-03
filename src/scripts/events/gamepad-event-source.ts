import {
    SnakeButtonDownEvent,
    SnakeGamepadEvent,
    SnakeGamepadEventType,
    SnakeJoystickDirectionChangedEvent
} from './snake-gamepad-event.ts';
import { GamepadState, getInitialGamepadState } from './gamepad-state.ts';
import { Point } from '../primitives/point.ts';
import { Direction } from '../enums/direction.ts';

export class GamepadEventSource {
    private readonly listenersMap: Map<SnakeGamepadEventType, ((e: SnakeGamepadEvent) => void)[]> = new Map();
    private readonly previousGamepadState: Map<number, GamepadState> = new Map();

    addEventListener(type: SnakeGamepadEventType, listener: (e: SnakeGamepadEvent) => void) {
        let l = this.listenersMap.get(type);

        if (!l) {
            l = [];
            this.listenersMap.set(type, l);
        }

        l.push(listener);
    }

    update() {
        const gamepads = navigator.getGamepads();

        for (const gamepad of gamepads) {
            if (!gamepad) continue;

            let prev = this.previousGamepadState.get(gamepad.index);

            if (!prev) {
                prev = getInitialGamepadState();
                this.previousGamepadState.set(gamepad.index, prev);
            }

            this.checkForButtonDown(gamepad, prev);
            this.checkForJoystickDirectionChanged(gamepad, prev);
        }
    }

    private checkForButtonDown(gamepad: Gamepad, prev: GamepadState) {
        gamepad.buttons.forEach((button, i) => {
            if (button.pressed && !prev.buttonPressed[i]) {
                this.emitButtonDown(i);
            }

            prev.buttonPressed[i] = button.pressed;
        });
    }

    private emitButtonDown(button: number) {
        const listeners = this.listenersMap.get('buttondown');
        if (!listeners) return;

        const event: SnakeButtonDownEvent = { type: 'buttondown', button };
        listeners.forEach(l => l(event));
    }

    private checkForJoystickDirectionChanged(gamepad: Gamepad, prev: GamepadState) {
        for(let i = 1; i < gamepad.axes.length; i += 2) {
            const x = gamepad.axes[i - 1];
            const y = gamepad.axes[i];
            const newDirection = this.getDirection(x, y);

            const joystickIndex = (i - 1) / 2;
            const oldDirection = prev.joystickDirection[joystickIndex] ?? Direction.None;

            if (!newDirection.equals(oldDirection)) {
                this.emitJoystickDirectionChanged(joystickIndex, newDirection);
                prev.joystickDirection[joystickIndex] = newDirection;
            }
        }
    }

    private getDirection(x: number, y: number): Point {
        // Can't move diagonally
        if (Math.abs(x) > Math.abs(y)) {
            y = 0;
        } else {
            x = 0;
        }

        return new Point(
            this.getAxesAsInteger(x),
            this.getAxesAsInteger(y));
    }

    private getAxesAsInteger(axes: number): -1|0|1 {
        const DEAD_ZONE = 0.2;

        if (axes >= DEAD_ZONE) {
            return 1;
        } else if (axes <= -DEAD_ZONE) {
            return -1;
        }

        return 0;
    }

    private emitJoystickDirectionChanged(joystickIndex: number, direction: Point) {
        const listeners = this.listenersMap.get('joystickdirectionchanged');
        if (!listeners) return;

        const event: SnakeJoystickDirectionChangedEvent = { type: 'joystickdirectionchanged', joystickIndex, direction };
        listeners.forEach(l => l(event));

    }
}
