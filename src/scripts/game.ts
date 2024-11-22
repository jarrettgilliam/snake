import { GameState } from './enums/game-state.ts';
import { Keys } from './enums/keys.ts';
import { Point } from './primitives/point.ts';
import { Direction } from './enums/direction.ts';
import { getCode, throwIfNull } from './utils.ts';
import { Drawable } from './interfaces/drawable.ts';
import { Apple } from './entities/apple.ts';
import { Snake } from './entities/snake.ts';
import * as constants from './constants.ts';
import { StartMenu } from './menus/start-menu.ts';
import { PauseMenu } from './menus/pause-menu.ts';
import { GameOverMenu } from './menus/game-over-menu.ts';
import { DefaultDifficulty, Difficulty } from './enums/difficulty.ts';

export class Game implements Drawable {
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;
    public readonly background: string;
    public gameState: GameState;
    public score = 0;
    public difficulty: Difficulty = DefaultDifficulty;
    public unitWidth = 0;
    public apple!: Apple;
    public snake!: Snake;
    private readonly storage?: Storage;
    private readonly startMenu: StartMenu;
    private readonly pauseMenu: PauseMenu;
    private readonly gameOverMenu: GameOverMenu;
    private lastTouchTime = 0;
    private lastTouch?: Point;

    constructor(canvas: HTMLCanvasElement, storage?: Storage) {
        this.canvas = canvas;
        this.storage = storage;

        this.ctx = throwIfNull(this.canvas.getContext("2d"));
        this.ctx.imageSmoothingEnabled = false;

        this.startMenu = new StartMenu(this);
        this.pauseMenu = new PauseMenu(this);
        this.gameOverMenu = new GameOverMenu(this);

        this.background = "#8dc100";

        window.addEventListener('resize', () => this.onresize());
        window.addEventListener('keydown', e => this.oninput(e));
        canvas.addEventListener('touchstart', e => this.oninput(e));
        canvas.addEventListener('touchend', e => this.oninput(e));
        canvas.addEventListener('mousedown', e => this.oninput(e));
        canvas.addEventListener('mouseup', e => this.oninput(e));
        canvas.addEventListener('blur', e => this.oninput(e));

        this.gameState = this.load() ? GameState.Paused : GameState.StartMenu;
    }

    save() {
        if (!this.storage) {
            return;
        }

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

    removeSave() {
        this.storage?.removeItem('snake');
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

    reset(data?: any) {
        this.score = (data?.score) || 0;
        this.difficulty = (data?.difficulty) || this.difficulty;
        this.lastTouchTime = 0;
        this.apple = new Apple(this, data && data.apple && data.apple.position);
        this.snake = new Snake(this, data && data.snake && data.snake.body);
    }

    onresize() {
        if (!this.canvas.parentElement) return;

        const size = Math.min(
            this.canvas.parentElement.clientHeight,
            this.canvas.parentElement.clientWidth);
        this.canvas.width = size;
        this.canvas.height = size;
        this.unitWidth = this.canvas.width / constants.GAME_SIZE;
    }

    onPlayingInput(e: any) {
        // pause when the canvas loses focus
        if (e.type === 'blur') {
            this.pause();
            return;
        }

        // handle touch and mouse input
        let touch: Point | undefined;
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

            directionDistancesFromTouch.sort((a, b) => a.distance - b.distance);

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

    oninput(e: any) {
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

    getTapPos(e: any): Point {
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
