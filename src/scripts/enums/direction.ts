import { Point } from '../primitives/point.ts';

export const Direction = {
    None: new Point(0, 0),
    Left: new Point(-1, 0),
    Up: new Point(0, -1),
    Right: new Point(1, 0),
    Down: new Point(0, 1)
} as const;
