import { Drawable } from '../interfaces/drawable.ts';
import { Point } from '../primitives/point.ts';
import { Rectangle } from '../primitives/rectangle.ts';
import * as constants from '../constants.ts';
import { Game } from '../game.ts';
import { PointData } from '../interfaces/point-data.ts';

export class Apple implements Drawable {
    public position: Point;
    private readonly game: Game;
    private readonly body: Rectangle[];

    constructor(game: Game, position?: PointData) {
        this.game = game;
        this.position = position ? Point.fromJSON(position) : new Point(14, 9);
        this.body = [
            new Rectangle(this.game, () => this.position.x + 0 / 3, () => this.position.y + 1 / 3, 1 / 3, 1 / 3),
            new Rectangle(this.game, () => this.position.x + 1 / 3, () => this.position.y + 0 / 3, 1 / 3, 1 / 3),
            new Rectangle(this.game, () => this.position.x + 2 / 3, () => this.position.y + 1 / 3, 1 / 3, 1 / 3),
            new Rectangle(this.game, () => this.position.x + 1 / 3, () => this.position.y + 2 / 3, 1 / 3, 1 / 3)
        ];
    }

    update() {
        const nbrUnoccupied = constants.GAME_SIZE ** 2 - this.game.snake.body.length;
        const rand = Math.floor(Math.random() * nbrUnoccupied);

        let current = 0;
        for (let y = 0; y < constants.GAME_SIZE; y++) {
            for (let x = 0; x < constants.GAME_SIZE; x++) {
                if (!this.game.snake.body.find(part => part.position.equalsXY(x, y))) {
                    current++;
                    if (current >= rand) {
                        this.position.x = x;
                        this.position.y = y;
                        return;
                    }
                }
            }
        }
    }

    draw() {
        this.body.forEach(r => r.draw());
    }
}
