export function getValueAsFunction<T>(value: T | (() => T)): () => T {
    if (value instanceof Function) {
        return value;
    } else {
        return () => value;
    }
}

export function throwIfNull<T>(value: T | null): T {
    if (value === null) {
        throw new Error(`Value of type ${typeof value} is null`);
    }

    return value;
}

export function debounce(func: () => void, timeout: number): () => void {
    let timeoutId: number;

    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(func, timeout);
    };
}
