import * as THREE from 'three';
import { SimpleVector } from './Types';

export class Utils {
    static now = (): Date => {
        return new Date();
    }

    static offsetTime = (date: Date, offset: number): Date => {
        return new Date(date.getTime() + offset);
    }

    static delay = async (duration: number): Promise<unknown> => {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    static createVectorJSON = (vector: THREE.Vector3 | THREE.Euler): SimpleVector => {
        return {
            x: vector.x,
            y: vector.y,
            z: vector.z,
        }
    }

    static createModel = (geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh => {
        const model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        model.receiveShadow = true;
        return model;
    }

    static setVector = (vector: THREE.Vector3 | THREE.Euler, simple: SimpleVector) => {
        vector.set(simple.x, simple.y, simple.z);
    }
}