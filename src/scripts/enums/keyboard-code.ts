export const KeyboardCode = {
    ArrowLeft: "ArrowLeft",
    ArrowUp: "ArrowUp",
    ArrowRight: "ArrowRight",
    ArrowDown: "ArrowDown",
    W: "KeyW",
    A: "KeyA",
    S: "KeyS",
    D: "KeyD",
    Enter: "Enter",
    Escape: "Escape",
} as const;

export type KeyboardCode = typeof KeyboardCode[keyof typeof KeyboardCode];

export function getKeyboardCode(e: KeyboardEvent): KeyboardCode | undefined {
    if (e.code) {
        return e.code as KeyboardCode;
    }

    // Added to support older browsers
    // noinspection JSDeprecatedSymbols
    switch (e.keyCode) {
        case 37: return KeyboardCode.ArrowLeft;
        case 38: return KeyboardCode.ArrowUp;
        case 39: return KeyboardCode.ArrowRight;
        case 40: return KeyboardCode.ArrowDown;
        case 87: return KeyboardCode.W;
        case 65: return KeyboardCode.A;
        case 83: return KeyboardCode.S;
        case 68: return KeyboardCode.D;
        case 13: return KeyboardCode.Enter;
        case 27: return KeyboardCode.Escape;
    }
}
