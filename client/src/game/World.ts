import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Octree } from 'three/examples/jsm/math/Octree';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper';

export class World {
    meshPath: string;
    lights: THREE.Light[];
    background: THREE.Color | THREE.Texture | null = null;
    fog: THREE.FogBase | null = null;
    octree: Octree;
    helper: OctreeHelper;

    constructor(meshPath: string) {
        this.meshPath = meshPath;
        this.lights = [];
        this.octree = new Octree();
        this.helper = new OctreeHelper(this.octree, new THREE.Color(0x88ccee));
        this.helper.visible = false;
    }

    loadWorld = (scene: THREE.Scene, animateCallback: () => void) => {
        const loader = new GLTFLoader().setPath('/gltf/');

        loader.load(this.meshPath, (gltf) => {
            scene.add(gltf.scene);
            this.octree.fromGraphNode(gltf.scene);
            gltf.scene.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material.map) {
                        child.material.map.anisotropy = 4;
                    }
                }
            });

            scene.add(this.helper);
            animateCallback();
        });
    }
}