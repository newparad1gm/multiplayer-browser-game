
import { MazeObjects } from './maze';

export interface JsonResponse {
    [name: string]: any;
}

export type ConnectionMessage = {
    connected?: string;
    world: string;
    isLead?: boolean;
    interval?: number;
    started: boolean;
    screenPos?: SimpleVector,
    screenDimensions?: SimpleVector, 
    maze?: ClientMaze;
}

export class Player {
    playerID: string;
    playerName: string;
    position: SimpleVector;
    velocity: SimpleVector;
    orientation: SimpleVector;
    direction: SimpleVector;
    shots: Shot[];

    constructor(playerID: string) {
        this.playerID = playerID;
        this.playerName = playerID;
        this.position = new SimpleVector();
        this.velocity = new SimpleVector();
        this.orientation = new SimpleVector();
        this.direction = new SimpleVector();
        this.shots = [];
    }
}

export class SimpleVector {
    x: number;
    y: number;
    z: number;

    constructor(x?: number, y?: number, z?: number) {
        this.setVector(x, y, z);
    }

    setVector(x?: number, y?: number, z?: number) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }
}

export class Shot {
    origin: SimpleVector;
    direction: SimpleVector;
    color: number;

    constructor(origin: SimpleVector, direction: SimpleVector, color: number) {
        this.origin = origin;
        this.direction = direction;
        this.color = color;
    }
}

export type ClientMaze = {
    width: number;
    height: number;
    wallHeight: number;
    boxMode: boolean;
    maze: MazeObjects[][];
}