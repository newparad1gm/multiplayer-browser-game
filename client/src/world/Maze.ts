export enum MazeObjects {
    Empty = 0,
    Wall = 1,
    Exit = 2,
    Entrance = 3
}

export class Maze {
    width: number;
    height: number;

    get cols(): number {
        return 2 * this.width + 1;
    }
    get rows(): number {
        return 2 * this.height + 1;
    }

    maze: MazeObjects[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.maze = [];
    }
}