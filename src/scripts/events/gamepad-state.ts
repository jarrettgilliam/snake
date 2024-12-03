import { Point } from '../primitives/point.ts';

export interface GamepadState {
    buttonPressed: boolean[];
    joystickDirection: Point[];
}

export function getInitialGamepadState(): GamepadState {
    return {
        buttonPressed: [],
        joystickDirection: []
    };
}
