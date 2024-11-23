import { Difficulty } from '../enums/difficulty.ts';
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
