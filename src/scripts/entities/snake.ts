import { Drawable } from '../interfaces/drawable.ts';
import * as constants from '../constants.ts';
import { SnakeBodyPart } from './snake-body-part.ts';
import { Direction } from '../enums/direction.ts';
import { Point } from '../primitives/point.ts';
import { Difficulty } from '../enums/difficulty.ts';
import { GameState } from '../enums/game-state.ts';

export class Snake implements Drawable {
    private readonly game: any;
    private nextUpdateTime: number;
    private velocity: Point;
    private newVelocityQueue: Point[];
    public readonly body: SnakeBodyPart[];
    private dying = false;

    constructor(game: any, bodyPoints?: { x: number, y: number }[]) {
        this.game = game;

        this.nextUpdateTime = 0;
        this.velocity = Direction.None;
        this.newVelocityQueue = [];
        this.body = [];

        if (bodyPoints) {
            for (const point of bodyPoints) {
                this.grow(Point.fromJSON(point));
            }
        } else {
            this.grow(new Point(4, 9));
            this.grow(new Point(3, 9));
            this.grow(new Point(2, 9));
        }
    }

    get head() {
        return this.body[0];
    }

    get tail() {
        return this.body.slice(1);
    }

    update(now: DOMHighResTimeStamp) {
        if (now >= this.nextUpdateTime) {
            while (now >= this.nextUpdateTime) {
                // @ts-ignore
                this.nextUpdateTime += Difficulty[this.game.difficulty];
            }

            this.velocity = this.newVelocityQueue.shift() || this.velocity;

            if (!this.velocity.equals(Direction.None)) {
                const oldTailPos: Point = this.move();

                if (this.head.position.x >= constants.SIZE ||
                    this.head.position.y >= constants.SIZE ||
                    this.head.position.x < 0 ||
                    this.head.position.y < 0 ||
                    this.tail.find(part => part.position.equals(this.head.position))) {
                    if (this.dying) {
                        this.game.gameState = GameState.GameOver;
                    } else {
                        this.dying = true;
                    }
                    this.moveBack(oldTailPos);
                    return;
                }
                this.dying = false;

                if (this.head.position.equals(this.game.apple.position)) {
                    this.grow(oldTailPos);
                    this.game.apple.update();
                    this.game.score++;
                }
            }
        }
    }

    move(): Point {
        let newPosition = new Point(
            this.head.position.x + this.velocity.x,
            this.head.position.y + this.velocity.y);

        for (let i = 0; i < this.body.length; i++) {
            const swap = this.body[i].position;
            this.body[i].position = newPosition;
            newPosition = swap;
        }

        return newPosition;
    }

    moveBack(oldPosition: Point) {
        for (let i = this.body.length - 1; i >= 0; i--) {
            const swap = this.body[i].position;
            this.body[i].position = oldPosition;
            oldPosition = swap;
        }
    }

    tryQueueNewDirection(newDirection: Point): boolean {
        let lastDirection = this.newVelocityQueue.slice(-1)[0] || this.velocity;

        // Don't add the new direction if it's the same as the last
        if (!newDirection.equals(lastDirection)) {

            if (lastDirection.equals(Direction.None)) {
                lastDirection = this.head.position.minus(this.tail[0].position);
            }

            // Don't allow changing direction 180 degrees
            if (lastDirection.x + newDirection.x !== 0 || lastDirection.y + newDirection.y !== 0) {
                // Don't allow queueing more than two moves
                if (this.newVelocityQueue.length < 2) {
                    this.newVelocityQueue.push(newDirection);
                    return true;
                }
            }
        }

        return false;
    }

    stop() {
        this.newVelocityQueue.length = 0;
        this.velocity = Direction.None;
    }

    grow(position: Point) {
        this.body.push(
            new SnakeBodyPart(
                this.game,
                position,
                this.body.length > 0
                    ? this.body[this.body.length - 1]
                    : undefined
            )
        );
    }

    draw() {
        for (const part of this.body) {
            part.draw();
        }
    }
}
