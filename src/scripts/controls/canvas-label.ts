import { Drawable } from '../interfaces/drawable.ts';
import { getValueAsFunction } from '../utils.ts';
import { Game } from '../game.ts';

export class CanvasLabel implements Drawable {
    public readonly text: () => string;
    protected readonly game: Game;
    protected readonly sizeFactor: number;
    private readonly YFactor: number;

    constructor(game: Game, text: string | (() => string), sizeFactor: number, YFactor: number) {
        this.game = game;
        this.text = getValueAsFunction(text);
        this.sizeFactor = sizeFactor;
        this.YFactor = YFactor;
    }

    get textColor() {
        return "#000000";
    }

    get textBaseline(): CanvasTextBaseline {
        return 'alphabetic';
    }

    get textXPos() {
        return this.game.canvas.width / 2 - this.textWidth / 2;
    }

    get textYPos() {
        return this.game.canvas.height * this.YFactor;
    }

    get textWidth() {
        return this.game.ctx.measureText(this.text()).width;
    }

    get textHeight() {
        return this.fontSize * 0.85;
    }

    get fontSize() {
        return Math.round(this.game.unitWidth) * this.sizeFactor
    }

    setFont() {
        this.game.ctx.font = this.fontSize + "px 'Press Start 2P'";
    }

    draw() {
        this.setFont();
        this.drawInternal();
    }

    drawInternal() {
        this.game.ctx.fillStyle = this.textColor;
        this.game.ctx.textBaseline = this.textBaseline;
        this.game.ctx.fillText(
            this.text(),
            this.textXPos,
            this.textYPos,
            this.game.canvas.width);
    }
}
