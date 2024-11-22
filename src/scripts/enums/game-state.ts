export const GameState = {
    StartMenu: 'StartMenu',
    Playing: 'Playing',
    Paused: 'Paused',
    GameOver: 'GameOver',
} as const;

export type GameState = typeof GameState[keyof typeof GameState];
