import { Point } from './point.ts';
import { Drawable } from '../interfaces/drawable.ts';
import { getValueAsFunction } from '../utils.ts';
import { Game } from '../game.ts';

export class Rectangle extends Point implements Drawable {
    private readonly game: Game;
    private _width!: () => number;
    private _height!: () => number;

    constructor(game: Game,
                x: number | (() => number),
                y: number | (() => number),
                width: number | (() => number),
                height: number | (() => number)) {
        super(x, y);
        this.game = game;
        this.width = width;
        this.height = height;
    }

    get width(): number {
        return this._width();
    }

    set width(value: number|(() => number)) {
        this._width = getValueAsFunction(value);
    }

    get height(): number {
        return this._height();
    }

    set height(value: number|(() => number)) {
        this._height = getValueAsFunction(value);
    }

    draw() {
        this.game.ctx.fillStyle = "#000000";
        this.game.ctx.fillRect(
            Math.round(this.x * this.game.unitWidth),
            Math.round(this.y * this.game.unitWidth),
            Math.ceil(this.width * this.game.unitWidth),
            Math.ceil(this.height * this.game.unitWidth)
        );
    }
}
