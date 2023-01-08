import { timingSafeEqual } from 'crypto';
import * as THREE from 'three';
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

export enum MazeObjects {
    Empty = 0,
    Wall = 1,
    Exit = 2,
    Entrance = 3
}

export class Maze {
    width: number;
    height: number;
    wallHeight: number;

    get cols(): number {
        return 2 * this.width + 1;
    }
    get rows(): number {
        return 2 * this.height + 1;
    }

    maze: MazeObjects[][];

    boxMode: boolean;

    constructor(width: number, height: number, boxMode?: boolean) {
        this.width = width;
        this.height = height;

        this.maze = [];
        this.wallHeight = 8;

        this.boxMode = boxMode || false;
    }

    generateWallMesh = (x: number, y: number, w: number, h: number, material: THREE.Material) => {
        const geom = new THREE.BoxGeometry(w, this.wallHeight, h);
        const mesh = new THREE.Mesh(geom, material);
        mesh.position.set(x, this.wallHeight / 2, y);
        return mesh;
    }

    generateWallGeometry = (r: number, c: number, material: THREE.Material) => {
        const meshes: THREE.Mesh[] = [];
        if (r - 1 >= 0 && this.maze[r - 1][c] === MazeObjects.Wall) {
            meshes.push(this.generateWallMesh(r - 0.25, c, 0.5, 0.05, material));
        }
        if (r < this.rows - 1 && this.maze[r + 1][c] === MazeObjects.Wall) {
            meshes.push(this.generateWallMesh(r + 0.25, c, 0.5, 0.05, material));
        }
        if (c - 1 >= 0 && this.maze[r][c - 1] === MazeObjects.Wall) {
            meshes.push(this.generateWallMesh(r, c - 0.25, 0.05, 0.5, material));
        }
        if (c < this.cols - 1 && this.maze[r][c + 1] === MazeObjects.Wall) {
            meshes.push(this.generateWallMesh(r, c + 0.25, 0.05, 0.5, material));
        }
        return meshes;
    }

    generateMazeMesh = (material: THREE.Material): THREE.Mesh => {
		const meshes: THREE.Mesh[] = [];
		this.maze.forEach((row, r) => {
			row.forEach((cell, c) => {
				if (cell === MazeObjects.Wall) {
                    if (this.boxMode) {
                        const geom = new THREE.BoxGeometry(1, 4, 1);
                        const wall = new THREE.Mesh(geom, material);
                        wall.position.set(r, 1, c);
                        meshes.push(wall);
                    } else {
					    meshes.push(...this.generateWallGeometry(r, c, material));
                    }
				}
			})
		});
		const mats: THREE.Material[] = [];
		const mazeGeom = BufferGeometryUtils.mergeBufferGeometries(meshes.map(m => {
			if (Array.isArray(m.material)) {
				mats.push(...m.material);
			} else {
				mats.push(m.material);
			}
			m.updateMatrixWorld();
			return m.geometry.applyMatrix4(m.matrixWorld);
		}), true);
		return new THREE.Mesh(mazeGeom, mats);
    }
}