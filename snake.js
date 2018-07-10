'use strict'

var Snake = (function () {
    function getValueAsFunction(value) {
        if (Object.getPrototypeOf(value) === Function.prototype) {
            return value;
        } else {
            return () => value;
        }
    }

    class Point {

        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        get x() {
            return this._x();
        }

        set x(value) {
            this._x = getValueAsFunction(value);
        }

        get y() {
            return this._y();
        }

        set y(value) {
            this._y = getValueAsFunction(value);
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
        Paused: 2,
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

    class Rectangle extends Point {

        constructor(game, x, y, width, height) {
            super(x, y);
            this.game = game;
            this.width = width;
            this.height = height;
        }

        get width() {
            return this._width();
        }

        set width(value) {
            this._width = getValueAsFunction(value);
        }

        get height() {
            return this._height();
        }

        set height(value) {
            this._height = getValueAsFunction(value);
        }

        draw() {
            this.game.ctx.fillStyle = "#000000";
            this.game.ctx.fillRect(
                Math.ceil(this.x * this.game.unitWidth),
                Math.ceil(this.y * this.game.unitWidth),
                Math.ceil(this.width * this.game.unitWidth),
                Math.ceil(this.height * this.game.unitWidth)
            );
        }
    }

    class Apple {

        constructor(game) {
            this.game = game;
            this.position = new Point(14, 9);
            this.body = [
                new Rectangle(this.game, () => this.position.x + 0 / 3, () => this.position.y + 1 / 3, 1 / 3, 1 / 3),
                new Rectangle(this.game, () => this.position.x + 1 / 3, () => this.position.y + 0 / 3, 1 / 3, 1 / 3),
                new Rectangle(this.game, () => this.position.x + 2 / 3, () => this.position.y + 1 / 3, 1 / 3, 1 / 3),
                new Rectangle(this.game, () => this.position.x + 1 / 3, () => this.position.y + 2 / 3, 1 / 3, 1 / 3)
            ];
        }

        update() {
            let nbrUnoccupied = Game.SIZE ** 2 - this.game.snake.body.length;

            let rand = Math.floor(Math.random() * nbrUnoccupied);

            let current = 0;
            for (let y = 0; y < Game.SIZE; y++) {
                for (let x = 0; x < Game.SIZE; x++) {
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
            for (let part of this.body) {
                part.draw();
            }
        }
    }

    class SnakeBodyPart {

        constructor(game, position, neighbor) {
            this.game = game;
            this.position = position;
            this.neighbor = neighbor;

            if (this.neighbor) {
                this.rectangle = new Rectangle(
                    this.game,
                    () => this.getAxisRelativePos(this.position.x, this.neighbor.position.x),
                    () => this.getAxisRelativePos(this.position.y, this.neighbor.position.y),
                    () => this.getAxisRelativeWidth(this.position.x, this.neighbor.position.x),
                    () => this.getAxisRelativeWidth(this.position.y, this.neighbor.position.y));
            } else {
                this.rectangle = new Rectangle(
                    this.game,
                    () => this.position.x + this.padding,
                    () => this.position.y + this.padding,
                    () => this.naturalWidth - this.padding * 2,
                    () => this.naturalWidth - this.padding * 2);
            }
        }

        get padding() {
            return 0.05;
        }

        get naturalWidth() {
            return 1;
        }

        getAxisRelativePos(axisPos, otherAxisPos) {
            if (otherAxisPos < axisPos) {
                return axisPos - this.padding;
            } else {
                return axisPos + this.padding;
            }
        }

        getAxisRelativeWidth(axisPos, otherAxisPos) {
            if (otherAxisPos < axisPos || otherAxisPos > axisPos) {
                return this.naturalWidth;
            } else {
                return this.naturalWidth - this.padding * 2;
            }
        }

        draw() {
            this.rectangle.draw();
        }
    }

    class Snake {

        constructor(game) {
            this.game = game;

            this.nextUpdateTime = 0;
            this.velocity = Direction.None;
            this.newVelocityQueue = [];
            this.body = [];

            this.grow(new Point(4, 9));
            this.grow(new Point(3, 9));
            this.grow(new Point(2, 9));
        }

        get head() {
            return this.body[0];
        }

        get tail() {
            return this.body.slice(1);
        }

        update(now) {
            if (now >= this.nextUpdateTime) {
                while (now >= this.nextUpdateTime) {
                    this.nextUpdateTime += this.game.interval;
                }

                if (this.newVelocityQueue.length > 0) {
                    this.velocity = this.newVelocityQueue.shift();
                }

                if (!this.velocity.equals(Direction.None)) {
                    let oldTailPos = this.move();

                    if (this.head.position.x >= Game.SIZE ||
                        this.head.position.y >= Game.SIZE ||
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

        move() {
            let newPosition = new Point(
                this.head.position.x + this.velocity.x,
                this.head.position.y + this.velocity.y);

            for (let i = 0; i < this.body.length; i++) {
                let swap = this.body[i].position;
                this.body[i].position = newPosition;
                newPosition = swap;
            }

            return newPosition;
        }

        moveBack(oldPosition) {
            for (let i = this.body.length - 1; i >= 0; i--) {
                let swap = this.body[i].position;
                this.body[i].position = oldPosition;
                oldPosition = swap;
            }
        }

        grow(position) {
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
            for (let part of this.body) {
                part.draw();
            }
        }
    }

    class CanvasLabel {

        constructor(game, text, sizeFactor, YFactor) {
            this.game = game;
            this.text = getValueAsFunction(text);
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
            this.selected = false;
        }

        get textColor() {
            if (this.selected) {
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
            return point.x >= this.btnXPos &&
                point.x <= this.btnXPos + this.btnWidth &&
                point.y >= this.btnYPos &&
                point.y <= this.btnYPos + this.btnHeight
        }

        drawInternal() {
            this.game.ctx.lineWidth = this.lineWidth;

            let func;
            if (this.selected) {
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

    class MenuBase {

        constructor(game, nextGameState, acceptSelectedCallback) {
            this.game = game;
            this.nextGameState = getValueAsFunction(nextGameState);
            this.acceptSelectedCallback = acceptSelectedCallback;
            this.labels = [];
            this.buttons = [];
        }

        get buttonIndex() {
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].selected) {
                    return i;
                }
            }
            return -1;
        }

        set buttonIndex(value) {
            if (value >= this.buttons.length) {
                value = 0;
            } else if (value < 0) {
                value = this.buttons.length - 1;
            }

            for (let i = 0; i < this.buttons.length; i++) {
                this.buttons[i].selected = (i == value);
            }
        }

        resetButtonIndex() {
            for (let i = 0; i < this.buttons.length; i++) {
                this.buttons[i].selected = false;
            }
        }

        oninput(e) {

            // handle touch and mouse input
            let touch;
            let touchstart;

            if (e.type.startsWith('touch')) {
                touch = this.game.getTapPos(e.changedTouches[0]);
                touchstart = e.type === 'touchstart';
            } else if (e.type.startsWith('mouse')) {
                touch = this.game.getTapPos(e);
                touchstart = e.type === 'mousedown';
            }

            if (touch) {
                for (let i in this.buttons) {
                    if (this.buttons[i].intersects(touch)) {
                        if (touchstart) {
                            this.buttonIndex = i;
                        } else if (this.buttonIndex == i) {
                            this.acceptSelectedOption();
                        }
                    }
                }
            }

            // handle keyboard input
            if (e.type === 'keydown') {
                if (e.keyCode === Keys.Enter) {
                    this.acceptSelectedOption();
                } else {
                    let idxOffset = 0;
                    if (e.keyCode === Keys.LeftArrow ||
                        e.keyCode === Keys.A ||
                        e.keyCode === Keys.UpArrow ||
                        e.keyCode === Keys.W) {
                        this.buttonIndex--;
                    }
                    else if (
                        e.keyCode === Keys.RightArrow ||
                        e.keyCode === Keys.D ||
                        e.keyCode === Keys.DownArrow ||
                        e.keyCode === Keys.S) {
                        this.buttonIndex++;
                    }
                }
            }
        }

        acceptSelectedOption() {
            if (this.buttonIndex >= 0) {
                this.game.gameState = this.nextGameState();
                this.acceptSelectedCallback();
            }
        }

        draw() {
            for (let label of this.labels) {
                label.draw();
            }
            for (let button of this.buttons) {
                button.draw();
            }
        }
    }

    class StartMenu extends MenuBase {

        constructor(game) {
            super(game, GameState.Playing, () => this.setupGame());

            this.labels.push(new CanvasLabel(game, "SNAKE", 3, 1 / 3));
            this.labels.push(new CanvasLabel(game, "CHOOSE YOUR DIFFICULTY", 0.6, 13 / 32));

            Object.keys(Difficuly).forEach((key, index) => {
                this.buttons.push(new CanvasButton(game, key, 0.8, 15 / 32 + index / 12));
            });
        }

        setupGame() {
            this.game.reset();
            this.game.interval = Difficuly[this.buttons[this.buttonIndex].text()];
        }
    }

    class GameOverMenu extends MenuBase {

        constructor(game) {
            super(game, GameState.StartMenu, () => this.resetButtonIndex());

            this.labels.push(new CanvasLabel(game, "GAME OVER", 2, 1 / 2));
            this.labels.push(new CanvasLabel(game, () => `YOUR SCORE: ${game.score}`, 0.8, 20 / 32));

            this.buttons.push(new CanvasButton(game, "Start_Over", 0.8, 22 / 32));
        }
    }

    class PauseMenu extends MenuBase {

        constructor(game) {
            super(game,
                () => this.getNextGameState(),
                () => this.resetButtonIndex());

            this.labels.push(new CanvasLabel(game, "PAUSED", 2, 1 / 2));
            this.labels.push(new CanvasLabel(game, () => `YOUR SCORE: ${game.score}`, 0.8, 20 / 32));

            this.buttons.push(new CanvasButton(game, "Resume", 0.8, 22 / 32));
            this.buttons.push(new CanvasButton(game, "Start_Over", 0.8, 22 / 32 + 1 / 12));
        }

        getNextGameState() {
            if (this.buttonIndex === 0) {
                return GameState.Playing;
            } else {
                return GameState.StartMenu;
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
            this.pauseMenu = new PauseMenu(this);
            this.gameOverMenu = new GameOverMenu(this);

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
            this.snake = new Snake(this);
            this.apple = new Apple(this);
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
                    e.keyCode === Keys.A) {
                    newDirection = Direction.Left;
                } else if (e.keyCode === Keys.UpArrow ||
                    e.keyCode === Keys.W) {
                    newDirection = Direction.Up;
                } else if (e.keyCode === Keys.RightArrow ||
                    e.keyCode === Keys.D) {
                    newDirection = Direction.Right;
                } else if (e.keyCode === Keys.DownArrow ||
                    e.keyCode === Keys.S) {
                    newDirection = Direction.Down;
                } else if (e.keyCode === Keys.Enter) {
                    newDirection = Direction.None;
                    this.gameState = GameState.Paused;
                }
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
            if (e.type.startsWith('touch')) {
                e.stopPropagation();
                e.preventDefault();
            }
            switch (this.gameState) {
                case GameState.StartMenu:
                    this.startMenu.oninput(e);
                    break;
                case GameState.Playing:
                    this.onPlayingInput(e);
                    break;
                case GameState.Paused:
                    this.pauseMenu.oninput(e);
                    break;
                case GameState.GameOver:
                    this.gameOverMenu.oninput(e);
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
            let animationCallback = (now) => {
                this.update(now);
                this.draw();
                requestAnimationFrame(animationCallback);
            }
            requestAnimationFrame(animationCallback);
        }

        update(now) {
            if (this.gameState === GameState.Playing) {
                this.snake.update(now);
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
                    this.pauseMenu.draw();
                    break;
                case GameState.GameOver:
                    this.gameOverMenu.draw();
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
