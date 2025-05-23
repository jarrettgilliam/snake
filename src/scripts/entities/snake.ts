import { Drawable } from '../interfaces/drawable.ts';
import * as constants from '../constants.ts';
import { SnakeBodyPart } from './snake-body-part.ts';
import { Direction } from '../enums/direction.ts';
import { Point } from '../primitives/point.ts';
import { Difficulty } from '../enums/difficulty.ts';
import { GameState } from '../enums/game-state.ts';
import { Game } from '../game.ts';
import { PointData } from '../interfaces/point-data.ts';

export class Snake implements Drawable {
    public readonly body: SnakeBodyPart[];
    private readonly game: Game;
    private nextUpdateTime: number;
    private velocity: Point;
    private newVelocityQueue: Point[];
    private dying = false;

    constructor(game: Game, bodyPoints: PointData[]) {
        this.game = game;

        this.nextUpdateTime = 0;
        this.velocity = Direction.None;
        this.newVelocityQueue = [];
        this.body = [];

        bodyPoints.forEach(p => this.grow(Point.fromJSON(p)));
    }

    get head() {
        return this.body[0];
    }

    get tail() {
        return this.body.slice(1);
    }

    update(now: DOMHighResTimeStamp) {
        if (now < this.nextUpdateTime) {
            return;
        }

        while (now >= this.nextUpdateTime) {
            this.nextUpdateTime += Difficulty[this.game.difficulty as keyof typeof Difficulty];
        }

        this.velocity = this.newVelocityQueue.shift() || this.velocity;
        if (this.velocity.equals(Direction.None)) {
            return;
        }

        const oldTailPos: Point = this.move();

        if (this.head.position.x >= constants.GAME_SIZE ||
            this.head.position.y >= constants.GAME_SIZE ||
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

    move(): Point {
        let newPosition = new Point(
            this.head.position.x + this.velocity.x,
            this.head.position.y + this.velocity.y);

        for (let i = 0; i < this.body.length; i++) {
            [newPosition, this.body[i].position] = [this.body[i].position, newPosition];
        }

        return newPosition;
    }

    moveBack(oldPosition: Point) {
        for (let i = this.body.length - 1; i >= 0; i--) {
            [oldPosition, this.body[i].position] = [this.body[i].position, oldPosition];
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
        this.body.forEach(p => p.draw());
    }
}
