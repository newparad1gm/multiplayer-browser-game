import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';

export class Player {
    playerID: string;
    collider: Capsule;
    velocity: THREE.Vector3;
    direction: THREE.Vector3;
    onFloor: boolean;
    model: THREE.Mesh;

    constructor(playerID: string, model: THREE.Mesh) {
        this.playerID = playerID;
        this.collider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.onFloor = false;
        this.model = model;
    }

    updatePlayer = (deltaTime: number, GRAVITY: number) => {
        let damping = Math.exp(-4 * deltaTime) - 1;
        if (!this.onFloor) {
            this.velocity.y -= GRAVITY * deltaTime;
            // small air resistance
            damping *= 0.1;
        }

        this.velocity.addScaledVector(this.velocity, damping);
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.collider.translate(deltaPosition);

        this.model.position.copy(this.collider.end);
    }
}