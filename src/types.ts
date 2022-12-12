export class Player {
    playerID: string;
    position: SimpleVector;
    velocity: SimpleVector;
    direction: SimpleVector;

    constructor(playerID: string) {
        this.playerID = playerID;
        this.position = new SimpleVector();
        this.velocity = new SimpleVector();
        this.direction = new SimpleVector();
    }
}

export class SimpleVector {
    x: number;
    y: number;
    z: number;

    constructor(x?: number, y?: number, z?: number) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }
}
