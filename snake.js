'use strict'

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(other) {
        return this.equalsXY(other.x, other.y);
    }

    equalsXY(x, y) {
        return this.x === x && this.y === y;
    }
}

var GameDifficuly = Object.freeze({
    Easy: 400,
    Medium: 200,
    Hard: 100,
    StupidHard: 50
});

var GameState = Object.freeze({
    StartMenu: 0,
    Instructions: 1,
    Playing: 2,
    GameOver: 3
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
    Left: new Point(-1, 0),
    Up: new Point(0, -1),
    Right: new Point(1, 0),
    Down: new Point(0, 1)
});

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
        this.update_body();
    }

    update_body() {
        this.body = [
            new Square(this.game, this.position.x + 0/3, this.position.y + 1/3, 1/3),
            new Square(this.game, this.position.x + 1/3, this.position.y + 0/3, 1/3),
            new Square(this.game, this.position.x + 2/3, this.position.y + 1/3, 1/3),
            new Square(this.game, this.position.x + 1/3, this.position.y + 2/3, 1/3)
        ];
    }

    update() {
        let nbrUnoccupied = SnakeGame.SIZE ** 2 - 
            this.game.snake.body.length;

        let rand = Math.floor(Math.random() * nbrUnoccupied);

        let current = 0;
        for (let y = 0; y < SnakeGame.SIZE; y++) {
            for (let x = 0; x < SnakeGame.SIZE; x++) {
                if (!this.game.snake.body.find(square => square.equalsXY(x,y))) {
                    current++;
                    if (current >= rand) {
                        this.position.x = x;
                        this.position.y = y;
                        this.update_body();
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
    constructor(game, bodyPoints) {
        this.game = game;

        this.velocity = Direction.Right;
        this.newVelocityQueue = [];

        this.body = [];
        for (let point of bodyPoints) {
            this.body.push(new Square(game, point.x, point.y, 1));
        }
    }

    update() {
        while (this.newVelocityQueue.length > 0) {
            let newVelocity = this.newVelocityQueue.shift();
            if (newVelocity.x + this.velocity.x !== 0 || newVelocity.y + this.velocity.y !== 0) {
                this.velocity = newVelocity;
                break;
            }
        }

        let head = this.body[this.body.length-1];
        let tail = this.body.shift();
        let newHead = new Square(
            this.game, 
            head.x + this.velocity.x, 
            head.y + this.velocity.y,
            1);

        if (newHead.x >= SnakeGame.SIZE ||
            newHead.y >= SnakeGame.SIZE ||
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

    draw() {
        for (let square of this.body) {
            square.draw();
        }
    }
}

class SnakeGame {

    static get SIZE() { return 20; }

    constructor(canvas, interval) {
        this.canvas = canvas;
        this.interval = interval;

        this.ctx = this.canvas.getContext("2d");
        this.background = "#8dc100";

        this.snake = new Snake(this, [
            new Point(1, 7),
            new Point(2, 7),
            new Point(3, 7)
        ]);
        this.apple = new Apple(this, 
            new Point(12, 7));

        this.gameState = GameState.Playing;
    }

    onresize() {
        let size = Math.min(
            this.canvas.parentElement.clientHeight, 
            this.canvas.parentElement.clientWidth);
        size *= 0.95;
        canvas.width = size;
        canvas.height = size;
    }

    oninput(input) {
        // handle touch and mouse input
        if (input.clientX || input.clientY) {
            let touch = this.getTapPos(input);
            if (touch.x > touch.y) {
                if (touch.y <= this.canvas.width - touch.x) {
                    this.snake.newVelocityQueue.push(Direction.Up);
                } else {
                    this.snake.newVelocityQueue.push(Direction.Right);
                }
            } else {
                if (touch.x <= this.canvas.height - touch.y) {
                    this.snake.newVelocityQueue.push(Direction.Left);
                } else {
                    this.snake.newVelocityQueue.push(Direction.Down);
                }
            }
        }

        // handle keyboard input
        if (input.keyCode) {
            if (input.keyCode === Keys.LeftArrow || 
                input.keyCode === Keys.A)
                this.snake.newVelocityQueue.push(Direction.Left);
            else if (input.keyCode === Keys.UpArrow || 
                     input.keyCode === Keys.W)
                this.snake.newVelocityQueue.push(Direction.Up);
            else if (input.keyCode === Keys.RightArrow || 
                     input.keyCode === Keys.D)
                this.snake.newVelocityQueue.push(Direction.Right);
            else if (input.keyCode === Keys.DownArrow || 
                     input.keyCode === Keys.S)
                this.snake.newVelocityQueue.push(Direction.Down);
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
                this.update();
                this.draw();
            }
            requestAnimationFrame(animationCallback);
        }
        requestAnimationFrame(animationCallback);
    }

    update() {
        if (this.gameState !== GameState.Playing) {
            return;
        }

        this.unitWidth = canvas.width / SnakeGame.SIZE;
        this.snake.update();
    }
    
    draw() {
        this.ctx.fillStyle = this.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.snake.draw();
        this.apple.draw();
    }
}

var canvas = document.getElementById("canvas");
var game = new SnakeGame(canvas, GameDifficuly.Hard);

window.addEventListener('resize', () => game.onresize());
window.addEventListener('keydown', e => game.oninput(e));
canvas.addEventListener('touchstart', e => game.oninput(e.touches[0]));
canvas.addEventListener('mousedown', e => game.oninput(e));

game.start();
