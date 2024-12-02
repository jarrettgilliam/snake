import { SnakeGamepadEvent, SnakeGamepadEventType } from './snake-gamepad-event.ts';

export class GamepadEventSource {
    private readonly listenersMap: Map<SnakeGamepadEventType, ((e: SnakeGamepadEvent) => void)[]> = new Map();
    private readonly previousGamepadState: Map<number, { buttonPressed: boolean[] }> = new Map();

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
                prev = { buttonPressed: [] };
                this.previousGamepadState.set(gamepad.index, prev);
            }

            gamepad.buttons.forEach((button, i) => {
                if (button.pressed && !prev.buttonPressed[i]) {
                    this.emitButtonDown(i);
                }

                prev.buttonPressed[i] = button.pressed;
            });
        }
    }

    private emitButtonDown(button: number) {
        const listeners = this.listenersMap.get('buttondown');
        if (!listeners) return;

        const event: SnakeGamepadEvent = { type: 'buttondown', button };
        listeners.forEach(l => l(event));
    }
}
