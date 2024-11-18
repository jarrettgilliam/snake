// @ts-nocheck
import { Difficulty } from './enums/difficulty.ts';
import { GameState } from './enums/game-state.ts';
import { Keys } from './enums/keys.ts';
import { Point } from './primitives/point.ts';
import { Direction } from './enums/direction.ts';
import { getCode, getValueAsFunction } from './utils.ts';
import { Drawable } from './interfaces/drawable.ts';
import { Apple } from './entities/apple.ts';
import { Snake } from './entities/snake.ts';
import * as constants from './constants.ts';

const SnakeIIFE = (function () {
    class CanvasLabel implements Drawable {

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

    class MenuBase implements Drawable {

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
                const code = getCode(e);
                if (code === Keys.Escape) {
                    this.clearButtonIndex();
                } else if (code === Keys.Enter) {
                    this.acceptSelectedOption();
                } else {
                    if (code === Keys.ArrowLeft ||
                        code === Keys.A ||
                        code === Keys.ArrowUp ||
                        code === Keys.W) {
                        this.buttonIndex--;
                    }
                    else if (
                        code === Keys.ArrowRight ||
                        code === Keys.D ||
                        code === Keys.ArrowDown ||
                        code === Keys.S) {
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
            for (const label of this.labels) {
                label.draw();
            }
            for (const button of this.buttons) {
                button.draw();
            }
        }
    }

    class StartMenu extends MenuBase {

        constructor(game) {
            const labels = [
                new CanvasLabel(game, "SNAKE", 3, 1 / 3),
                new CanvasLabel(game, "CHOOSE YOUR DIFFICULTY", 0.6, 13 / 32)
            ];

            const buttons = [];
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

    class Game implements Drawable {

        constructor(canvas, storage) {
            this.canvas = canvas;
            this.storage = storage;

            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;
            this.background = "#8dc100";

            this.startMenu = new StartMenu(this);
            this.pauseMenu = new PauseMenu(this);
            this.gameOverMenu = new GameOverMenu(this);

            window.addEventListener('resize', () => this.onresize());
            window.addEventListener('keydown', e => this.oninput(e));
            canvas.addEventListener('touchstart', e => this.oninput(e));
            canvas.addEventListener('touchend', e => this.oninput(e));
            canvas.addEventListener('mousedown', e => this.oninput(e));
            canvas.addEventListener('mouseup', e => this.oninput(e));
            canvas.addEventListener('blur', e => this.oninput(e));

            if (this.load()) {
                this.gameState = GameState.Paused;
            } else {
                this.gameState = GameState.StartMenu;
            }
        }

        save() {
            if (this.storage) {
                const data = JSON.stringify({
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
        }

        removeSave() {
            if (this.storage) {
                this.storage.removeItem('snake');
            }
        }

        load() {
            if (!this.storage) {
                return false;
            }

            const data = this.storage.getItem('snake');

            if (!data) {
                return false;
            }

            this.reset(JSON.parse(data));

            return true;
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
            const size = Math.min(
                this.canvas.parentElement.clientHeight,
                this.canvas.parentElement.clientWidth);
            canvas.width = size;
            canvas.height = size;
            this.unitWidth = canvas.width / constants.SIZE;
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
                const now = performance.now();
                if (now - this.lastTouchTime <= constants.DOUBLE_TAP_PAUSE_TIME_LIMIT &&
                    touch.distanceFrom(this.lastTouch) <= this.unitWidth) {
                    this.pause();
                    return;
                }
                this.lastTouch = touch;
                this.lastTouchTime = now;

                const directionDistancesFromTouch = Object.values(Direction)
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

                for (const d of directionDistancesFromTouch) {
                    if (this.snake.tryQueueNewDirection(d.direction)) {
                        break;
                    }
                }
            }

            // handle keyboard input
            if (e.type === 'keydown') {
                const code = getCode(e);
                if (code === Keys.ArrowLeft || code === Keys.A) {
                    this.snake.tryQueueNewDirection(Direction.Left);
                } else if (code === Keys.ArrowUp || code === Keys.W) {
                    this.snake.tryQueueNewDirection(Direction.Up);
                } else if (code === Keys.ArrowRight || code === Keys.D) {
                    this.snake.tryQueueNewDirection(Direction.Right);
                } else if (code === Keys.ArrowDown || code === Keys.S) {
                    this.snake.tryQueueNewDirection(Direction.Down);
                } else if (code === Keys.Enter || code === Keys.Escape) {
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
            const rect = this.canvas.getBoundingClientRect();
            return new Point(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
        }

        start() {
            this.onresize();
            const animationCallback = (now: DOMHighResTimeStamp) => {
                this.update(now);
                this.draw();
                requestAnimationFrame(animationCallback);
            };
            requestAnimationFrame(animationCallback);
        }

        update(now: DOMHighResTimeStamp) {
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

let localStorage;
try {
    localStorage = window.localStorage;
}
catch (err) {
    console.log(err.message);
}

const canvas = document.getElementById("canvas");
const game = new SnakeIIFE.Game(canvas, localStorage);

if (document.fonts && document.fonts.load) {
    document.fonts.load('10pt "Press Start 2P"').then(() => game.start());
}
else {
    game.start();
}
