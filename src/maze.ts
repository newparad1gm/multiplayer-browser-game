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
        
        this.maze = this.initArray(MazeObjects.Empty);

        this.placeInitialWalls();
        
        // start partitioning
        this.partition(1, this.height - 1, 1, this.width - 1);
    }

    get clientMaze() {
        return {
            width: this.width,
            height: this.height,

            maze: this.maze
        };
    }

    placeInitialWalls = () => {
        this.maze.forEach((row, r) => {
            row.forEach((cell, c) => {
                switch (r) {
                    case 0:
                    case this.rows - 1:
                        this.maze[r][c] = MazeObjects.Wall;
                        break;
                    default:
                        if (r % 2 === 1) {
                            if ((c === 0) || (c === this.cols - 1)) {
                                this.maze[r][c] = MazeObjects.Wall;
                            }
                        } else if (c % 2 === 0) {
                            this.maze[r][c] = MazeObjects.Wall;
                        }
                }
            });

            if (r === 0) {
                // place exit in top row
                let doorPos = this.posToSpace(this.rand(1, this.width));
                this.maze[r][doorPos] = MazeObjects.Exit;
            }

            if (r === this.rows - 1) {
                // place entrance in bottom row
                let doorPos = this.posToSpace(this.rand(1, this.width));
                this.maze[r][doorPos] = MazeObjects.Entrance;
            }
        });
    }

    initArray = (value: MazeObjects): MazeObjects[][] => {
		return new Array(this.rows).fill(undefined).map(() => new Array<MazeObjects>(this.cols).fill(value));
    }

    rand = (min: number, max: number): number => {
        return min + Math.floor(Math.random() * (1 + max - min));
    }

    posToSpace = (x: number): number => {
		return 2 * (x - 1) + 1;
    }

    posToWall = (x: number): number => {
        return 2 * x;
    }

    inBounds = (r: number, c: number): boolean => {
        if ((typeof this.maze[r] === 'undefined') || (typeof this.maze[r][c] === 'undefined')) {
            return false; // out of bounds
        }
        return true;
    }
        
    shuffle = (array: boolean[]): boolean[] => {
        // sauce: https://stackoverflow.com/a/12646864
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    partition = (r1: number, r2: number, c1: number, c2: number) => {
        // create partition walls
        // ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method
    
        let horiz, vert, x, y, start, end;

        if ((r2 < r1) || (c2 < c1)) {
            return false;
        }

        if(r1 === r2) {
            horiz = r1;
        } else {
            x = r1 + 1;
            y = r2 - 1;
            start = Math.round(x + (y - x) / 4);
            end = Math.round(x + 3 * (y - x) / 4);
            horiz = this.rand(start, end);
		}

		if (c1 === c2) {
			vert = c1;
		} else {
			x = c1 + 1;
			y = c2 - 1;
			start = Math.round(x + (y - x) / 3);
			end = Math.round(x + 2 * (y - x) / 3);
			vert = this.rand(start, end);
		}

		for (let i = this.posToWall(r1) - 1; i <= this.posToWall(r2) + 1; i++) {
			for (let j = this.posToWall(c1) - 1; j <= this.posToWall(c2) + 1; j++) {
				if ((i === this.posToWall(horiz)) || (j === this.posToWall(vert))) {
			        this.maze[i][j] = MazeObjects.Wall;
				}
			}
		}

		let gaps = this.shuffle([true, true, true, false]);

		// create gaps in partition walls

		if (gaps[0]) {
			let gapPosition = this.rand(c1, vert);
			this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = MazeObjects.Empty;
		}

		if (gaps[1]) {
			let gapPosition = this.rand(vert + 1, c2 + 1);
			this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = MazeObjects.Empty;
		}

		if (gaps[2]) {
			let gapPosition = this.rand(r1, horiz);
			this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = MazeObjects.Empty;
		}

		if (gaps[3]) {
			let gapPosition = this.rand(horiz + 1, r2 + 1);
			this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = MazeObjects.Empty;
		}

		// recursively partition newly created chambers

		this.partition(r1, horiz-1, c1, vert-1);
		this.partition(horiz+1, r2, c1, vert-1);
		this.partition(r1, horiz-1, vert+1, c2);
		this.partition(horiz+1, r2, vert+1, c2);

    }
}