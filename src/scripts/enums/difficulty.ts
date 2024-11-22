export const Difficulty = {
    Placebo: 2000,
    Very_Easy: 800,
    Easy: 400,
    Medium: 200,
    Hard: 100,
    Stupid_Hard: 50
} as const;

export type Difficulty = keyof typeof Difficulty;

export const DefaultDifficulty = 'Medium';
