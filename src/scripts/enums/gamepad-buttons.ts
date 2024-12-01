import { KeyboardCode } from './keyboard-code.ts';

export const GamepadButtons = {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    LeftShoulder: 4,
    RightShoulder: 5,
    LeftTrigger: 6,
    RightTrigger: 7,
    Select: 8,
    Start: 9,
    LeftStick: 10,
    RightStick: 11,
    DPad_Up: 12,
    DPad_Down: 13,
    DPad_Left: 14,
    DPad_Right: 15,
    Guide: 16, // Xbox/PS button
    PS_Touchpad: 17
} as const;

export function toKeyboardCode(gamepadButton: number): KeyboardCode | undefined {
    switch (gamepadButton) {
        case GamepadButtons.Select: return KeyboardCode.Escape;
        case GamepadButtons.B: return KeyboardCode.Escape;
        case GamepadButtons.Start: return KeyboardCode.Enter;
        case GamepadButtons.A: return KeyboardCode.Enter;
        case GamepadButtons.DPad_Up: return KeyboardCode.ArrowUp;
        case GamepadButtons.DPad_Down: return KeyboardCode.ArrowDown;
        case GamepadButtons.DPad_Left: return KeyboardCode.ArrowLeft;
        case GamepadButtons.DPad_Right: return KeyboardCode.ArrowRight;
    }
}
