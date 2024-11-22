import { Keys } from './enums/keys.ts';

export function getValueAsFunction<T>(value: T | (() => T)): () => T {
    if (value instanceof Function) {
        return value;
    } else {
        return () => value;
    }
}

export function getCode(e: KeyboardEvent): string | null {
    if (e.code) {
        return e.code;
    }

    // Added to support older browsers
    // noinspection JSDeprecatedSymbols
    switch (e.keyCode) {
        case 37: return Keys.ArrowLeft;
        case 38: return Keys.ArrowUp;
        case 39: return Keys.ArrowRight;
        case 40: return Keys.ArrowDown;
        case 87: return Keys.W;
        case 65: return Keys.A;
        case 83: return Keys.S;
        case 68: return Keys.D;
        case 13: return Keys.Enter;
        case 27: return Keys.Escape;
    }

    return null;
}

export function throwIfNull<T>(value: T | null): T {
    if (value === null) {
        throw new Error(`Value of type ${typeof value} is null`);
    }

    return value;
}
