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
        Very_Easy: 800,
        Easy: 400,
        Medium: 200,
        Hard: 100,
        Stupid_Hard: 50
    });

    var GameState = Object.freeze({
        StartMenu: 0,
        Playing: 1,
        GameOver: 2
    });

    var Keys = Object.freeze({
        LeftArrow: 37,
        UpArrow: 38,
        RightArrow: 39,
        DownArrow: 40,
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        Enter: 13
    });

    var Direction = Object.freeze({
        None: new Point(0, 0),
        Left: new Point(-1, 0),
        Up: new Point(0, -1),
        Right: new Point(1, 0),
        Down: new Point(0, 1)
    });

    class CanvasLabel {

        constructor(game, text, sizeFactor, YFactor) {
            this.game = game;

            if (Object.getPrototypeOf(text) === Function.prototype) {
                this.text = text;
            } else {
                this.text = () => text;
            }

            this.sizeFactor = sizeFactor;
            this.YFactor = YFactor;
        }

        get textColor() {
            return "#000000";
        }

        get textBaseline() {
            return "alphabetic";
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

    class CanvasButton extends CanvasLabel {

        constructor(game, text, sizeFactor, YFactor) {
            super(game, text, sizeFactor, YFactor)
            this.hovering = false;
        }

        get textColor() {
            if (this.hovering) {
                return this.game.background;
            } else {
                return super.textColor;
            }
        }

        get textBaseline() {
            return "top";
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

        intersects(point) {
            if (point.x >= this.btnXPos &&
                point.x <= this.btnXPos + this.btnWidth &&
                point.y >= this.btnYPos &&
                point.y <= this.btnYPos + this.btnHeight) {
                return true;
            }
            return false;
        }

        drawInternal() {
            this.game.ctx.lineWidth = this.lineWidth;

            let func;
            if (this.hovering) {
                func = this.game.ctx.fillRect;
            } else {
                func = this.game.ctx.strokeRect;
            }

            func.call(
                this.game.ctx,
                this.btnXPos,
                this.btnYPos,
                this.btnWidth,
                this.btnHeight);

            super.drawInternal();
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
                new Square(this.game, this.position.x + 0 / 3, this.position.y + 1 / 3, 1 / 3),
                new Square(this.game, this.position.x + 1 / 3, this.position.y + 0 / 3, 1 / 3),
                new Square(this.game, this.position.x + 2 / 3, this.position.y + 1 / 3, 1 / 3),
                new Square(this.game, this.position.x + 1 / 3, this.position.y + 2 / 3, 1 / 3)
            ];
        }

        update() {
            let nbrUnoccupied = Game.SIZE ** 2 -
                this.game.snake.body.length;

            let rand = Math.floor(Math.random() * nbrUnoccupied);

            let current = 0;
            for (let y = 0; y < Game.SIZE; y++) {
                for (let x = 0; x < Game.SIZE; x++) {
                    if (!this.game.snake.body.find(square => square.equalsXY(x, y))) {
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
                    this.game.score++;
                }
            }
        }

        draw() {
            for (let square of this.body) {
                square.draw();
            }
        }
    }

    class StartMenu {

        constructor(game) {
            this.game = game;
            this.snakeLabel = new CanvasLabel(this.game, "SNAKE", 3, 1 / 3);
            this.instructionsLabel = new CanvasLabel(this.game, "CHOOSE YOUR DIFFICULTY", 0.6, 13 / 32);

            this.difficultyButtons = [];
            Object.keys(Difficuly).forEach((key, index) => {
                this.difficultyButtons.push(new CanvasButton(this.game, key, 0.8, 15 / 32 + index / 12));
            });
        }

        get difficultyButtonIndex() {
            for (let i = 0; i < this.difficultyButtons.length; i++) {
                if (this.difficultyButtons[i].hovering) {
                    return i;
                }
            }
            
            return -1;
        }

        set difficultyButtonIndex(value) {
            if (value >= this.difficultyButtons.length) {
                value = 0;
            } else if (value < 0) {
                value = this.difficultyButtons.length - 1;
            }

            for (let i = 0; i < this.difficultyButtons.length; i++) {
                this.difficultyButtons[i].hovering = (i == value);
            }
        }

        get selectedDifficulty() {
            return Difficuly[this.difficultyButtons[this.difficultyButtonIndex].text()];
        }

        oninput(e) {

            // handle touch and mouse input
            let touch;
            let touchstart;

            if (e.type.startsWith('touch')) {
                e.stopPropagation();
                e.preventDefault();
                touch = this.game.getTapPos(e.changedTouches[0]);
                touchstart = e.type === 'touchstart';
            } else if (e.type.startsWith('mouse')) {
                touch = this.game.getTapPos(e);
                touchstart = e.type === 'mousedown';
            }

            if (touch) {
                for (let i in this.difficultyButtons) {
                    if (this.difficultyButtons[i].intersects(touch)) {
                        if (touchstart) {
                            this.difficultyButtonIndex = i;
                        } else if (this.difficultyButtonIndex == i) {
                            this.acceptSelectedDifficulty();
                        }
                    }
                }
            }

            // handle keyboard input
            if (e.keyCode) {
                if (e.keyCode === Keys.Enter) {
                    this.acceptSelectedDifficulty();
                } else {
                    let idxOffset = 0;
                    if (e.keyCode === Keys.LeftArrow ||
                        e.keyCode === Keys.A ||
                        e.keyCode === Keys.UpArrow ||
                        e.keyCode === Keys.W) {
                        this.difficultyButtonIndex--;
                    }
                    else if (
                        e.keyCode === Keys.RightArrow ||
                        e.keyCode === Keys.D ||
                        e.keyCode === Keys.DownArrow ||
                        e.keyCode === Keys.S) {
                        this.difficultyButtonIndex++;
                    }
                }
            }
        }

        acceptSelectedDifficulty() {
            this.game.reset();
            this.game.interval = this.selectedDifficulty;
            this.game.gameState = GameState.Playing;
        }

        draw() {
            this.snakeLabel.draw();
            this.instructionsLabel.draw();
            for (let btn of this.difficultyButtons.values()) {
                btn.draw();
            }
        }
    }

    class Game {

        static get SIZE() { return 20; }

        constructor(canvas) {
            this.canvas = canvas;
            this.interval = Difficuly.Medium;

            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;
            this.background = "#8dc100";

            this.startMenu = new StartMenu(this);

            this.gameOverLabel = new CanvasLabel(this, "GAME OVER", 2, 1 / 2);
            this.scoreLabel = new CanvasLabel(this, () => `YOUR SCORE: ${this.score}`, 0.8, 5 / 8);

            this.gameState = GameState.StartMenu;

            window.addEventListener('resize', () => game.onresize());
            window.addEventListener('keydown', e => game.oninput(e));
            canvas.addEventListener('touchstart', e => game.oninput(e));
            canvas.addEventListener('touchend', e => game.oninput(e));
            canvas.addEventListener('mousedown', e => game.oninput(e));
            canvas.addEventListener('mouseup', e => game.oninput(e));
        }

        reset() {
            this.score = 0;
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
            canvas.width = size;
            canvas.height = size;
            this.unitWidth = canvas.width / Game.SIZE;
        }

        onPlayingInput(e) {
            let newDirection;

            // handle touch and mouse input
            let touch;
            if (e.type === 'touchstart') {
                e.stopPropagation();
                e.preventDefault();
                touch = this.getTapPos(e.changedTouches[0]);
            } else if (e.type === 'mousedown') {
                touch = this.getTapPos(e);
            }

            if (touch) {
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
            if (e.type === 'keydown') {
                if (e.keyCode === Keys.LeftArrow ||
                    e.keyCode === Keys.A)
                    newDirection = Direction.Left;
                else if (e.keyCode === Keys.UpArrow ||
                    e.keyCode === Keys.W)
                    newDirection = Direction.Up;
                else if (e.keyCode === Keys.RightArrow ||
                    e.keyCode === Keys.D)
                    newDirection = Direction.Right;
                else if (e.keyCode === Keys.DownArrow ||
                    e.keyCode === Keys.S)
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

        oninput(e) {
            switch (this.gameState) {
                case GameState.StartMenu:
                    this.startMenu.oninput(e);
                    break;
                case GameState.Playing:
                    this.onPlayingInput(e);
                    break;
                case GameState.Paused:
                    break;
                case GameState.GameOver:
                    this.reset();
                    this.gameState = GameState.StartMenu;
                    break;
            }
        }

        getTapPos(e) {
            let rect = this.canvas.getBoundingClientRect();
            return new Point(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
        }

        start() {
            game.onresize();

            var then = Date.now();
            var timeSinceLastFrame = 0;

            let animationCallback = () => {
                if (this.gameState === GameState.Playing) {

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
                } else {
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
                    this.startMenu.draw();
                    break;
                case GameState.Playing:
                    this.snake.draw();
                    this.apple.draw();
                    break;
                case GameState.Paused:
                    break;
                case GameState.GameOver:
                    this.gameOverLabel.draw();
                    this.scoreLabel.draw();
                    break;
            }
        }
    }

    return {
        Game: Game
    };
})();

var canvas = document.getElementById("canvas");
var game = new Snake.Game(canvas);

document.fonts.load('10pt "Press Start 2P"').then(() => game.start());
