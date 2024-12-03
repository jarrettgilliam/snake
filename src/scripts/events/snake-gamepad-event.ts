import { InputEvent } from './input-event.ts';
import { Point } from '../primitives/point.ts';

export const SnakeGamepadEventTypes = ['buttondown', 'joystickdirectionchanged'] as const;

export type SnakeGamepadEventType = typeof SnakeGamepadEventTypes[number];

export interface SnakeButtonDownEvent {
    type: 'buttondown';
    button: number;
}

export interface SnakeJoystickDirectionChangedEvent {
    type: 'joystickdirectionchanged';
    joystickIndex: number;
    direction: Point;
}

export type SnakeGamepadEvent = SnakeButtonDownEvent | SnakeJoystickDirectionChangedEvent;

export function isSnakeGamepadEvent(event: InputEvent): event is SnakeGamepadEvent {
    return SnakeGamepadEventTypes.includes(event.type as SnakeGamepadEventType);
}
