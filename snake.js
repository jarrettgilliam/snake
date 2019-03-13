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

        minus(other) {
            return new Point(
                this.x - other.x,
                this.y - other.y
            );
        }

        equals(other) {
            if (!other) return false;
            return this.equalsXY(other.x, other.y);
        }

        equalsXY(x, y) {
            return this.x === x && this.y === y;
        }

        distanceFrom(other) {
            if (!other) return NaN;
            return this.distanceFromXY(other.x, other.y);
        }

        distanceFromXY(x, y) {
            return Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        }

        toJSON() {
            return {
                x: this.x,
                y: this.y
            };
        }

        static fromJSON(obj) {
            return new Point(obj.x, obj.y);
        }
    }

    var Difficulty = Object.freeze({
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
        ArrowLeft: "ArrowLeft",
        ArrowUp: "ArrowUp",
        ArrowRight: "ArrowRight",
        ArrowDown: "ArrowDown",
        W: "KeyW",
        A: "KeyA",
        S: "KeyS",
        D: "KeyD",
        Enter: "Enter",
        Escape: "Escape",
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
                Math.round(this.x * this.game.unitWidth),
                Math.round(this.y * this.game.unitWidth),
                Math.ceil(this.width * this.game.unitWidth),
                Math.ceil(this.height * this.game.unitWidth)
            );
        }
    }

    class Apple {

        constructor(game, position) {
            this.game = game;
            if (position) {
                this.position = Point.fromJSON(position);
            } else {
                this.position = new Point(14, 9);
            }
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

            this.rectangle = new Rectangle(
                this.game,
                () => this.position.x + this.padding,
                () => this.position.y + this.padding,
                () => this.naturalWidth - this.padding * 2,
                () => this.naturalWidth - this.padding * 2);

            if (this.neighbor) {
                this.connector = new Rectangle(
                    this.game,
                    () => this.getAxisRelativePos(this.position.x, this.neighbor.position.x),
                    () => this.getAxisRelativePos(this.position.y, this.neighbor.position.y),
                    () => this.getAxisRelativeWidth(this.position.x, this.neighbor.position.x),
                    () => this.getAxisRelativeWidth(this.position.y, this.neighbor.position.y));
            }
        }

        get padding() {
            return 0.05;
        }

        get naturalWidth() {
            return 1;
        }

        getAxisRelativePos(axisPos, otherAxisPos) {
            if (otherAxisPos === axisPos) {
                return axisPos + this.padding;
            } else if (otherAxisPos < axisPos) {
                return axisPos - this.padding;
            } else { // otherAxisPos > axisPos
                return axisPos + this.naturalWidth - this.padding;
            }
        }

        getAxisRelativeWidth(axisPos, otherAxisPos) {
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

    class Snake {

        constructor(game, bodyPoints) {
            this.game = game;

            this.nextUpdateTime = 0;
            this.velocity = Direction.None;
            this.newVelocityQueue = [];
            this.body = [];

            if (bodyPoints) {
                for (let point of bodyPoints) {
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

        update(now) {
            if (now >= this.nextUpdateTime) {
                while (now >= this.nextUpdateTime) {
                    this.nextUpdateTime += Difficulty[this.game.difficulty];
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

        tryQueueNewDirection(newDirection) {
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

        constructor(game, nextGameState, acceptSelectedCallback, labels, buttons) {
            this.game = game;
            this.nextGameState = getValueAsFunction(nextGameState);
            this.acceptSelectedCallback = acceptSelectedCallback;
            this.labels = labels;
            this.buttons = buttons;
            this.resetButtonIndex();
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
                this.buttons[i].selected = (i === value);
            }
        }

        get defaultButtonIndex() {
            return 0;
        }

        resetButtonIndex() {
            this.buttonIndex = this.defaultButtonIndex;
        }

        clearButtonIndex() {
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
                let found = false;
                for (let i = 0; i < this.buttons.length; i++) {
                    if (this.buttons[i].intersects(touch)) {
                        found = true;
                        if (touchstart) {
                            this.buttonIndex = i;
                        } else if (this.buttonIndex === i) {
                            this.acceptSelectedOption();
                        }
                        break;
                    }
                }
                if (!found) {
                    this.clearButtonIndex();
                }
            }

            // handle keyboard input
            if (e.type === 'keydown') {
                if (e.code === Keys.Escape) {
                    this.clearButtonIndex();
                } else if (e.code === Keys.Enter) {
                    this.acceptSelectedOption();
                } else {
                    if (e.code === Keys.ArrowLeft ||
                        e.code === Keys.A ||
                        e.code === Keys.ArrowUp ||
                        e.code === Keys.W) {
                        this.buttonIndex--;
                    }
                    else if (
                        e.code === Keys.ArrowRight ||
                        e.code === Keys.D ||
                        e.code === Keys.ArrowDown ||
                        e.code === Keys.S) {
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
            let labels = [
                new CanvasLabel(game, "SNAKE", 3, 1 / 3),
                new CanvasLabel(game, "CHOOSE YOUR DIFFICULTY", 0.6, 13 / 32)
            ];

            let buttons = [];
            Object.keys(Difficulty).forEach((key, index) => {
                buttons.push(new CanvasButton(game, key, 0.8, 15 / 32 + index / 12));
            });

            super(game, GameState.Playing, () => this.setupGame(), labels, buttons);
        }

        get defaultButtonIndex() {
            return this.buttons.findIndex(b => b.text() === "Medium");
        }

        setupGame() {
            this.game.reset();
            this.game.difficulty = this.buttons[this.buttonIndex].text();
        }
    }

    class GameOverMenu extends MenuBase {

        constructor(game) {
            super(game, GameState.StartMenu, () => this.resetButtonIndex(),
                [
                    new CanvasLabel(game, "GAME OVER", 2, 7 / 16),
                    new CanvasLabel(game, () => `DIFFICULTY: ${game.difficulty}`, 0.7, 35 / 64),
                    new CanvasLabel(game, () => `YOUR SCORE: ${game.score}`, 0.7, 39 / 64)
                ],
                [
                    new CanvasButton(game, "Start_Over", 0.8, 22 / 32)
                ]);
        }
    }

    class PauseMenu extends MenuBase {

        constructor(game) {
            super(game, () => this.getNextGameState(), () => this.onUnpause(),
                [
                    new CanvasLabel(game, "PAUSED", 2, 7 / 16),
                    new CanvasLabel(game, () => `DIFFICULTY: ${game.difficulty}`, 0.7, 35 / 64),
                    new CanvasLabel(game, () => `YOUR SCORE: ${game.score}`, 0.7, 39 / 64)
                ],
                [
                    new CanvasButton(game, "Resume", 0.8, 22 / 32),
                    new CanvasButton(game, "Start_Over", 0.8, 22 / 32 + 1 / 12)
                ]);
        }

        getNextGameState() {
            if (this.buttonIndex === 0) {
                return GameState.Playing;
            } else {
                return GameState.StartMenu;
            }
        }

        onUnpause() {
            this.game.removeSave();
            this.resetButtonIndex();
        }
    }

    class Game {

        static get SIZE() { return 20; }
        static get DOUBLE_TAP_PAUSE_TIME_LIMIT() { return 200; }

        constructor(canvas, storage) {
            this.canvas = canvas;
            this.storage = storage;

            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;
            this.background = "#8dc100";

            this.startMenu = new StartMenu(this);
            this.pauseMenu = new PauseMenu(this);
            this.gameOverMenu = new GameOverMenu(this);

            window.addEventListener('resize', () => game.onresize());
            window.addEventListener('keydown', e => game.oninput(e));
            canvas.addEventListener('touchstart', e => game.oninput(e));
            canvas.addEventListener('touchend', e => game.oninput(e));
            canvas.addEventListener('mousedown', e => game.oninput(e));
            canvas.addEventListener('mouseup', e => game.oninput(e));
            canvas.addEventListener('blur', e => game.oninput(e));

            if (this.load()) {
                this.gameState = GameState.Paused;
            } else {
                this.gameState = GameState.StartMenu;
            }
        }

        save() {
            let data = JSON.stringify({
                score: this.score,
                difficulty: this.difficulty,
                apple: {
                    position: this.apple.position
                },
                snake: {
                    body: this.snake.body.map(x => x.position)
                }
            });
            this.storage.setItem('snake', data);
        }

        removeSave() {
            this.storage.removeItem('snake');
        }

        load() {
            let found = false;
            let data = this.storage.getItem('snake');

            if (data) {
                found = true;
                data = JSON.parse(data);
            }

            this.reset(data);

            return found;
        }

        reset(data) {
            this.score = (data && data.score) || 0;
            this.difficulty = (data && data.difficulty) || this.difficulty;
            if (data && data.interval) {
                this.difficulty = Object.keys(Difficulty).find(x => Difficulty[x] === data.interval)
            }
            this.lastTouchTime = 0;
            this.apple = new Apple(this, data && data.apple && data.apple.position);
            this.snake = new Snake(this, data && data.snake && data.snake.body);
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
            // pause when the canvas loses focus
            if (e.type === 'blur') {
                this.pause();
                return;
            }

            // handle touch and mouse input
            let touch;
            if (e.type === 'touchstart') {
                touch = this.getTapPos(e.changedTouches[0]);
            } else if (e.type === 'mousedown') {
                touch = this.getTapPos(e);
            }

            if (touch) {
                // pause on two finger taps
                let now = performance.now();
                if (now - this.lastTouchTime <= Game.DOUBLE_TAP_PAUSE_TIME_LIMIT &&
                    touch.distanceFrom(this.lastTouch) <= this.unitWidth) {
                    this.pause();
                    return;
                }
                this.lastTouch = touch;
                this.lastTouchTime = now;

                let directionDistancesFromTouch = Object.values(Direction)
                    .filter(d => !d.equals(Direction.None))
                    .map(d => {
                        return {
                            direction: d,
                            distance: touch.distanceFromXY(
                                (d.x + this.snake.head.position.x + 0.5) * this.unitWidth,
                                (d.y + this.snake.head.position.y + 0.5) * this.unitWidth)
                        };
                    });

                directionDistancesFromTouch.sort((a, b) => {
                    if (a.distance < b.distance)
                        return -1;
                    if (a.distance > b.distance)
                        return 1;
                    return 0;
                });

                for (let d of directionDistancesFromTouch) {
                    if (this.snake.tryQueueNewDirection(d.direction)) {
                        break;
                    }
                }
            }

            // handle keyboard input
            if (e.type === 'keydown') {
                if (e.code === Keys.ArrowLeft || e.code === Keys.A) {
                    this.snake.tryQueueNewDirection(Direction.Left);
                } else if (e.code === Keys.ArrowUp || e.code === Keys.W) {
                    this.snake.tryQueueNewDirection(Direction.Up);
                } else if (e.code === Keys.ArrowRight || e.code === Keys.D) {
                    this.snake.tryQueueNewDirection(Direction.Right);
                } else if (e.code === Keys.ArrowDown || e.code === Keys.S) {
                    this.snake.tryQueueNewDirection(Direction.Down);
                } else if (e.code === Keys.Enter || e.code === Keys.Escape) {
                    this.pause();
                }
            }
        }

        oninput(e) {
            if (e.type.startsWith('touch')) {
                e.stopPropagation();
                e.preventDefault();
            }
            if (e.type !== 'blur' && e.type !== 'resize') {
                this.canvas.focus();
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

        pause() {
            this.snake.stop();
            this.gameState = GameState.Paused;
            this.save();
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
var game = new Snake.Game(canvas, window.localStorage);

document.fonts.load('10pt "Press Start 2P"').then(() => game.start());
