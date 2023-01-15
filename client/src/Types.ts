import * as THREE from 'three';
import { WorldName } from './world/WorldLoader';

export type Model = {
    mesh: THREE.Mesh;
    collider: THREE.Sphere;
    velocity: THREE.Vector3;
}

export type Vectors = {
    vector1: THREE.Vector3;
    vector2: THREE.Vector3;
    vector3: THREE.Vector3;
}

export type SimplePlayer = {
    playerID: string;
    playerName: string;
    position: SimpleVector;
    velocity: SimpleVector;
    orientation: SimpleVector;
    direction: SimpleVector;
    shots: Shot[];
}

export type SimpleVector = {
    x: number;
    y: number;
    z: number;
}

export type Shot = {
    origin: SimpleVector;
    direction: SimpleVector;
    color: number;
}

export type State = {
    [playerID: string]: SimplePlayer
}

export type StartMessage = {
    start: {
        world: WorldName,
        maze?: {
            width: number,
            height: number,
            boxMode: boolean
        }
        screenDimensions?: SimpleVector,
        screenPos?: SimpleVector
    }
}