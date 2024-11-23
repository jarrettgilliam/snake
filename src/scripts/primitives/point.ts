import { getValueAsFunction } from '../utils.ts';
import { PointData } from '../interfaces/point-data.ts';

export class Point {
    private _x!: () => number;
    private _y!: () => number;

    constructor(x: number | (() => number),
                y: number | (() => number)) {
        this.x = x;
        this.y = y;
    }

    get x(): number {
        return this._x();
    }

    set x(value: number | (() => number)) {
        this._x = getValueAsFunction(value);
    }

    get y(): number {
        return this._y();
    }

    set y(value: number | (() => number)) {
        this._y = getValueAsFunction(value);
    }

    minus(other: Point): Point {
        return new Point(
            this.x - other.x,
            this.y - other.y
        );
    }

    equals(other?: Point): boolean {
        if (!other) return false;
        return this.equalsXY(other.x, other.y);
    }

    equalsXY(x: number, y: number): boolean {
        return this.x === x && this.y === y;
    }

    distanceFrom(other?: Point): number {
        if (!other) return NaN;
        return this.distanceFromXY(other.x, other.y);
    }

    distanceFromXY(x: number, y: number): number {
        return Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
    }

    toJSON(): PointData {
        return {
            x: this.x,
            y: this.y
        };
    }

    static fromJSON(obj: PointData): Point {
        return new Point(obj.x, obj.y);
    }
}
