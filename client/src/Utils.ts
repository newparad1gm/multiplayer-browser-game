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

	static getPositionFromMatrix = (m: THREE.Matrix4): THREE.Vector3 => {
        return new THREE.Vector3(
            m.elements[12], 
            m.elements[13], 
            m.elements[14]
        );
	}

	static getScaleFromMatrix = (m: THREE.Matrix4): THREE.Vector3 => {
        const vector = new THREE.Vector3();

		var sx = vector.set( m.elements[0], m.elements[1], m.elements[2] ).length();
		var sy = vector.set( m.elements[4], m.elements[5], m.elements[6] ).length();
		var sz = vector.set( m.elements[8], m.elements[9], m.elements[10] ).length();

		vector.x = sx;
		vector.y = sy;
		vector.z = sz;

		return vector;
	}
}