import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { Utils } from '../Utils';

export class CSSPlane {
    position: THREE.Vector3;
    rotation: THREE.Euler;

    cssDimensions: THREE.Vector2;
    planeDimensions: THREE.Vector2;

    object?: THREE.Object3D;
    cssObject?: CSS3DObject;
    mesh?: THREE.Mesh;

    get cssPixelWidth(): string {
        return `${this.cssDimensions.x}px`;
    }

    get cssPixelHeight(): string {
        return `${this.cssDimensions.y}px`;
    }

    get cssScale(): THREE.Vector3 {
        return new THREE.Vector3(
            this.planeDimensions.x/this.cssDimensions.x, 
            this.planeDimensions.y/this.cssDimensions.y, 
            1
        );
    }

    constructor(position: THREE.Vector3, rotation: THREE.Euler, cssDimensions: THREE.Vector2, planeDimensions: THREE.Vector2) {
        this.position = position;
        this.rotation = rotation;
        this.cssDimensions = cssDimensions;
        this.planeDimensions = planeDimensions;
    }

    createCSSObject = (element: HTMLElement) => {
        element.style.width = this.cssPixelWidth;
        element.style.height = this.cssPixelHeight;
        
        const div = document.createElement('div');
        div.style.width = this.cssPixelWidth;
        div.style.height = this.cssPixelHeight;
        div.style.backgroundColor = '#000';
        div.appendChild(element);

        const object = new CSS3DObject(div);
        object.position.copy(this.position);
        object.rotation.copy(this.rotation);

        this.cssObject = object;
        return object;
    }

    createObject = () => {
        const object = new THREE.Object3D();
        const tMaterial = new THREE.MeshBasicMaterial();
        tMaterial.color.set('black');
        tMaterial.opacity = 0;
        tMaterial.blending = THREE.NoBlending;

        const geometry = new THREE.PlaneGeometry(this.planeDimensions.x, this.planeDimensions.y, 16, 16);
        const mesh = new THREE.Mesh(geometry, tMaterial);
        mesh.position.copy(this.position);
        mesh.rotation.copy(this.rotation);
        object.add(mesh);

        this.mesh = mesh;
        this.object = object;
        return object;
    }

    renderObject = (scene: THREE.Scene) => {
        if (!this.mesh || !this.cssObject) {
            return;
        }
        scene.updateMatrixWorld();
        const worldMat = this.mesh.matrixWorld;
        
        this.cssObject.position.copy(Utils.getPositionFromMatrix(worldMat));
        this.cssObject.scale.copy(Utils.getScaleFromMatrix(worldMat).multiply(this.cssScale));
    }
}