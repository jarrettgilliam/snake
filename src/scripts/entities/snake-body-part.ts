import { Drawable } from '../interfaces/drawable.ts';
import { Point } from '../primitives/point.ts';
import { Rectangle } from '../primitives/rectangle.ts';
import { Game } from '../game.ts';

export class SnakeBodyPart implements Drawable {
    public position: Point;
    private readonly game: Game;
    private readonly neighbor?: SnakeBodyPart;
    private readonly rectangle: Rectangle;
    private readonly connector?: Rectangle;

    constructor(game: Game, position: Point, neighbor?: SnakeBodyPart) {
        this.game = game;
        this.position = position;
        this.neighbor = neighbor;

        this.rectangle = new Rectangle(
            this.game,
            () => this.position.x + this.padding,
            () => this.position.y + this.padding,
            () => this.naturalWidth - this.padding * 2,
            () => this.naturalWidth - this.padding * 2);

        if (this.neighbor) {
            this.connector = new Rectangle(
                this.game,
                () => this.getAxisRelativePos(this.position.x, this.neighbor!.position.x),
                () => this.getAxisRelativePos(this.position.y, this.neighbor!.position.y),
                () => this.getAxisRelativeWidth(this.position.x, this.neighbor!.position.x),
                () => this.getAxisRelativeWidth(this.position.y, this.neighbor!.position.y));
        }
    }

    get padding() {
        return 0.05;
    }

    get naturalWidth() {
        return 1;
    }

    getAxisRelativePos(axisPos: number, otherAxisPos: number) {
        if (otherAxisPos === axisPos) {
            return axisPos + this.padding;
        } else if (otherAxisPos < axisPos) {
            return axisPos - this.padding;
        } else { // otherAxisPos > axisPos
            return axisPos + this.naturalWidth - this.padding;
        }
    }

    getAxisRelativeWidth(axisPos: number, otherAxisPos: number) {
        if (otherAxisPos < axisPos || otherAxisPos > axisPos) {
            return this.padding * 2;
        } else {
            return this.naturalWidth - this.padding * 2;
        }
    }

    draw() {
        this.rectangle.draw();
        if (this.connector) {
            this.connector.draw();
        }
    }
}
