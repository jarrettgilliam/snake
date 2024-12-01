import { InputEvent } from './input-event.ts';

export const SnakeGamepadEventTypes = ['buttondown'] as const;

export type SnakeGamepadEventType = typeof SnakeGamepadEventTypes[number];

export interface SnakeGamepadEvent {
    type: SnakeGamepadEventType;
    button: number;
}

export function isSnakeGamepadEvent(event: InputEvent): event is SnakeGamepadEvent {
    return SnakeGamepadEventTypes.includes(event.type as SnakeGamepadEventType);
}
