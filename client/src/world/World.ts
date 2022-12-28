import * as THREE from 'three';
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper";
import { Octree } from "three/examples/jsm/math/Octree";

export class World {
    lights: THREE.Light[];
    background: THREE.Color | THREE.Texture | null = null;
    fog: THREE.FogBase | null = null;
    octree: Octree;
    helper: OctreeHelper;

    constructor() {
        this.lights = [];
        this.octree = new Octree();
        this.helper = new OctreeHelper(this.octree, new THREE.Color(0x88ccee));
        this.helper.visible = false;
    }

    startScene = (scene: THREE.Scene) => {        
        scene.background = this.background;
        scene.fog = this.fog;

        for (const light of this.lights) {
            scene.add(light);
        }
    }
}