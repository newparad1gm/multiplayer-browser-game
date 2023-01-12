import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { AnimatedModel } from './AnimatedModel';
import { TextLabel } from './TextLabel';

export class Player {
    playerID: string;
    playerName: string;
    collider: Capsule;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    direction: THREE.Vector3;
    orientation: THREE.Euler;
    onFloor: boolean;
    model?: AnimatedModel;
    isLead: boolean;

    readonly height: number = 1.66;

    protected nameLabel: TextLabel;

    constructor(playerID: string, playerName: string, modelPath?: string) {
        this.playerID = playerID;
        this.playerName = playerName;
        this.collider = new Capsule();
        this.initializeCollider();
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.orientation = new THREE.Euler();
        this.onFloor = false;
        if (modelPath) {
            this.model = new AnimatedModel(modelPath);
        }
        this.nameLabel = new TextLabel(this.playerName);
        this.isLead = false;
    }

    loadPlayer = (scene: THREE.Scene) => {
        if (this.model) {
            this.model.loadModel(scene);
        }
        this.nameLabel.loadLabel(scene);
    }

    removePlayer = (scene: THREE.Scene) => {
        if (this.model && this.model.model) {
            scene.remove(this.model.model);
        }
        this.nameLabel.removeLabel(scene);
    }

    initializeCollider = () => {
        this.collider.start.set(-5, 0.35, 5);
        this.collider.end.set(-5, this.height, 5);
        this.collider.radius = 0.35;
    }

    get speed(): number {
        return Math.sqrt(this.velocity.dot(this.velocity));
    }

    translateColliderToPosition = () => {
        this.position.x = this.collider.end.x;
        this.position.y = this.collider.end.y - this.height;
        this.position.z = this.collider.end.z;
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
        if (this.model) {
            this.translateColliderToPosition();
            this.model.updateModel(this.position, this.orientation, this.speed, deltaTime);
            this.nameLabel.updateLabel(this.playerName, this.collider.end);
        }
    }
}