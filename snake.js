'use strict'

var Snake = (function () {
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        equals(other) {
            if (!other) return false;
            return this.equalsXY(other.x, other.y);
        }

        equalsXY(x, y) {
            return this.x === x && this.y === y;
        }
    }

    var Difficuly = Object.freeze({
        Placebo: 2000,
        VeryEasy: 1000,
        Easy: 400,
        Medium: 200,
        Hard: 100,
        StupidHard: 50
    });

    var GameState = Object.freeze({
        StartMenu: 0,
        Instructions: 1,
        Playing: 2,
        Paused: 3,
        GameOver: 4
    });

    var Keys = Object.freeze({
        LeftArrow: 37,
        UpArrow: 38,
        RightArrow: 39,
        DownArrow: 40,
        W: 87,
        A: 65,
        S: 83,
        D: 68
    });

    var Direction = Object.freeze({
        None: new Point(0, 0),
        Left: new Point(-1, 0),
        Up: new Point(0, -1),
        Right: new Point(1, 0),
        Down: new Point(0, 1)
    });

    class CanvasLabel {
        constructor(game, text, sizeFactor) {
            this.game = game;
            this.text = text;
            this.sizeFactor = sizeFactor;
        }

        draw() {
            this.game.ctx.font = Math.round(this.game.unitWidth) * this.sizeFactor + "px 'Press Start 2P'";
            this.game.ctx.fillStyle = "#000000";
            this.game.ctx.fillText(
                this.text,
                Math.round(this.game.canvas.width / 2 - this.game.ctx.measureText(this.text).width / 2),
                Math.round(this.game.canvas.height / 2));
        }
    }

    class Square extends Point {
        constructor(game, x, y, size) {
            super(x, y);
            this.game = game;
            this.size = size;
        }

        draw() {
            this.game.ctx.fillStyle = "#000000";
            this.game.ctx.fillRect(
                Math.ceil(this.x * this.game.unitWidth),
                Math.ceil(this.y * this.game.unitWidth),
                Math.ceil(this.size * this.game.unitWidth),
                Math.ceil(this.size * this.game.unitWidth)
            );
        }
    }

    class Apple {
        constructor(game, position) {
            this.game = game;
            this.position = position;
            this.updateBody();
        }

        updateBody() {
            this.body = [
                new Square(this.game, this.position.x + 0/3, this.position.y + 1/3, 1/3),
                new Square(this.game, this.position.x + 1/3, this.position.y + 0/3, 1/3),
                new Square(this.game, this.position.x + 2/3, this.position.y + 1/3, 1/3),
                new Square(this.game, this.position.x + 1/3, this.position.y + 2/3, 1/3)
            ];
        }

        update() {
            let nbrUnoccupied = Game.SIZE ** 2 -
                this.game.snake.body.length;

            let rand = Math.floor(Math.random() * nbrUnoccupied);

            let current = 0;
            for (let y = 0; y < Game.SIZE; y++) {
                for (let x = 0; x < Game.SIZE; x++) {
                    if (!this.game.snake.body.find(square => square.equalsXY(x,y))) {
                        current++;
                        if (current >= rand) {
                            this.position.x = x;
                            this.position.y = y;
                            this.updateBody();
                            return;
                        }
                    }
                }
            }
        }

        draw() {
            for (let square of this.body) {
                square.draw();
            }
        }
    }

    class Snake {
        constructor(game, velocity, bodyPoints) {
            this.game = game;

            this.velocity = velocity;
            this.newVelocityQueue = [];

            this.body = [];
            for (let point of bodyPoints) {
                this.body.push(new Square(game, point.x, point.y, 1));
            }
        }

        update() {
            if (this.newVelocityQueue.length > 0) {
                this.velocity = this.newVelocityQueue.shift();
            }


            if (!this.velocity.equals(Direction.None)) {
                let head = this.body[this.body.length - 1];
                let tail = this.body.shift();
                let newHead = new Square(
                    this.game,
                    head.x + this.velocity.x,
                    head.y + this.velocity.y,
                    1);

                if (newHead.x >= Game.SIZE ||
                    newHead.y >= Game.SIZE ||
                    newHead.x < 0 ||
                    newHead.y < 0 ||
                    this.body.find(square => square.equals(newHead))) {
                    if (this.dying) {
                        this.game.gameState = GameState.GameOver;
                    } else {
                        this.dying = true;
                    }
                    this.body.unshift(tail);
                    return;
                }
                this.dying = false;

                this.body.push(newHead);

                if (newHead.equals(this.game.apple.position)) {
                    this.body.unshift(tail);
                    this.game.apple.update();
                }
            }
        }

        draw() {
            for (let square of this.body) {
                square.draw();
            }
        }
    }

    class Game {

        static get SIZE() { return 20; }

        constructor(canvas, interval) {
            this.canvas = canvas;
            this.interval = interval;

            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;
            this.background = "#8dc100";
            this.startMenuLabel = new CanvasLabel(this, "TAP TO START", 1);
            this.gameOverLabel = new CanvasLabel(this, "GAME OVER", 2);

            this.gameState = GameState.StartMenu;
        }

        reset() {
            this.snake = new Snake(
                this,
                Direction.None,
                [
                    new Point(2, 9),
                    new Point(3, 9),
                    new Point(4, 9)
                ]
            );

            this.apple = new Apple(this, new Point(14, 9));
        }

        onresize() {
            let size = Math.min(
                this.canvas.parentElement.clientHeight,
                this.canvas.parentElement.clientWidth);
            size *= 0.95;
            canvas.width = size;
            canvas.height = size;
            this.unitWidth = canvas.width / Game.SIZE;
        }

        onPlayingInput(input) {
            let newDirection;

            // handle touch and mouse input
            if (input.clientX || input.clientY) {
                let touch = this.getTapPos(input);
                if (touch.x > touch.y) {
                    if (touch.y <= this.canvas.width - touch.x) {
                        newDirection = Direction.Up;
                    } else {
                        newDirection = Direction.Right;
                    }
                } else {
                    if (touch.x <= this.canvas.height - touch.y) {
                        newDirection = Direction.Left;
                    } else {
                        newDirection = Direction.Down;
                    }
                }
            }

            // handle keyboard input
            if (input.keyCode) {
                if (input.keyCode === Keys.LeftArrow ||
                    input.keyCode === Keys.A)
                    newDirection = Direction.Left;
                else if (input.keyCode === Keys.UpArrow ||
                    input.keyCode === Keys.W)
                    newDirection = Direction.Up;
                else if (input.keyCode === Keys.RightArrow ||
                    input.keyCode === Keys.D)
                    newDirection = Direction.Right;
                else if (input.keyCode === Keys.DownArrow ||
                    input.keyCode === Keys.S)
                    newDirection = Direction.Down;
            }

            if (newDirection) {
                let lastDirection = this.snake.newVelocityQueue.slice(-1)[0] || this.snake.velocity;

                // Don't add the new direction if it's the same as the last
                if (!newDirection.equals(lastDirection)) {
                    // Don't allow changing direction 180 degrees
                    if (lastDirection.x + newDirection.x !== 0 || lastDirection.y + newDirection.y !== 0) {
                        // Don't allow queueing more than two moves
                        if (this.snake.newVelocityQueue.length < 2) {
                            this.snake.newVelocityQueue.push(newDirection);
                        }
                    }
                }
            }
        }

        oninput(input) {
            switch (this.gameState) {
                case GameState.StartMenu:
                    this.reset();
                    this.gameState = GameState.Playing
                    break;
                case GameState.Instructions:
                    break;
                case GameState.Playing:
                    this.onPlayingInput(input);
                    break;
                case GameState.Paused:
                    break;
                case GameState.GameOver:
                    this.reset();
                    this.gameState = GameState.StartMenu;
                    break;
            }
        }

        getTapPos(mouseEvent) {
            let rect = this.canvas.getBoundingClientRect();
            return new Point(
                mouseEvent.clientX - rect.left,
                mouseEvent.clientY - rect.top
            );
        }

        start() {
            game.onresize();

            var then = Date.now();
            var timeSinceLastFrame = 0;

            let animationCallback = () => {
                let now = Date.now();
                let elapsed = now - then;
                then = now;

                timeSinceLastFrame += elapsed;
                if (timeSinceLastFrame > this.interval) {
                    timeSinceLastFrame -= this.interval;
                    if (timeSinceLastFrame > this.interval) {
                        timeSinceLastFrame = this.interval;
                    }
                    this.update();
                    this.draw();
                }
                requestAnimationFrame(animationCallback);
            }
            requestAnimationFrame(animationCallback);
        }

        update() {
            switch (this.gameState) {
                case GameState.StartMenu:
                    break;
                case GameState.Instructions:
                    break;
                case GameState.Playing:
                    this.snake.update();
                    break;
                case GameState.Paused:
                    break;
                case GameState.GameOver:
                    break;
            }
        }

        draw() {
            this.ctx.fillStyle = this.background;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            switch (this.gameState) {
                case GameState.StartMenu:
                    this.startMenuLabel.draw();
                    break;
                case GameState.Instructions:
                    break;
                case GameState.Playing:
                    this.snake.draw();
                    this.apple.draw();
                    break;
                case GameState.Paused:
                    break;
                case GameState.GameOver:
                    this.gameOverLabel.draw();
                    break;
            }
        }
    }

    return {
        Game: Game,
        Difficuly: Difficuly
    };
})();

var canvas = document.getElementById("canvas");
var game = new Snake.Game(canvas, Snake.Difficuly.Hard);

window.addEventListener('resize', () => game.onresize());
window.addEventListener('keydown', e => game.oninput(e));
canvas.addEventListener('touchstart', e => {
    game.oninput(e.changedTouches[0]);
    e.stopPropagation();
    e.preventDefault();
});
canvas.addEventListener('mousedown', e => game.oninput(e));

game.start();
