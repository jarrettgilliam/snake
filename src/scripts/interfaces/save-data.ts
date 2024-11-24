import { DEFAULT_DIFFICULTY, Difficulty } from '../enums/difficulty.ts';
import { PointData } from './point-data.ts';

export interface SaveData {
    score: number;
    difficulty: Difficulty;
    apple: {
        position: PointData;
    };
    snake: {
        body: PointData[];
    };
}

export const InitialState: SaveData = {
    score: 0,
    difficulty: DEFAULT_DIFFICULTY,
    apple: {
        position: { x: 14, y: 9 }
    },
    snake: {
        body: [
            { x: 4, y: 9 },
            { x: 3, y: 9 },
            { x: 2, y: 9 }
        ]
    }
};
