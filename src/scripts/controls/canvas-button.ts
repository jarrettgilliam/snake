import { CanvasLabel } from './canvas-label.ts';
import { Point } from '../primitives/point.ts';
import { Game } from '../game.ts';

export class CanvasButton<T> extends CanvasLabel {
    public selected: boolean;

    constructor(game: Game, text: string, sizeFactor: number, YFactor: number, public data: T) {
        super(game, text, sizeFactor, YFactor)
        this.selected = false;
    }

    get textColor() {
        return this.selected ? this.game.background : super.textColor;
    }

    get textBaseline(): CanvasTextBaseline {
        return 'top';
    }

    get lineWidth() {
        return this.game.unitWidth / 10 * this.sizeFactor;
    }

    get padding() {
        return this.game.unitWidth / 3 * this.sizeFactor;
    }

    get btnXPos() {
        return this.textXPos - this.padding;
    }

    get btnYPos() {
        return this.textYPos - this.padding;
    }

    get btnWidth() {
        return this.textWidth + this.padding * 2;
    }

    get btnHeight() {
        return this.textHeight + this.padding * 2;
    }

    intersects(point: Point) {
        return point.x >= this.btnXPos &&
            point.x <= this.btnXPos + this.btnWidth &&
            point.y >= this.btnYPos &&
            point.y <= this.btnYPos + this.btnHeight
    }

    drawInternal() {
        this.game.ctx.lineWidth = this.lineWidth;

        const func = this.selected ? this.game.ctx.fillRect : this.game.ctx.strokeRect;

        func.call(
            this.game.ctx,
            this.btnXPos,
            this.btnYPos,
            this.btnWidth,
            this.btnHeight);

        super.drawInternal();
    }
}
