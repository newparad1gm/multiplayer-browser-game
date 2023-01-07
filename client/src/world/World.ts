import * as THREE from 'three';
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper";
import { Octree } from "three/examples/jsm/math/Octree";
import { CSSPlane } from '../game/CSSPlane';
import { Maze } from './Maze';

export class World {
    lights: THREE.Light[];
    background: THREE.Color | THREE.Texture | null = null;
    fog: THREE.FogBase | null = null;
    octree: Octree;
    helper: OctreeHelper;
    cssPlanes: CSSPlane[];
    maze: Maze;

    constructor() {
        this.lights = [];
        this.octree = new Octree();
        this.helper = new OctreeHelper(this.octree, new THREE.Color(0x88ccee));
        this.helper.visible = false;
        this.cssPlanes = [];
        this.maze = new Maze(10, 10);
    }

    renderCSSPlanes = (scene: THREE.Scene) => {
        for (const plane of this.cssPlanes) {
            plane.renderObject(scene);
        }
    }

    startScene = (scene: THREE.Scene, cssScene?: THREE.Scene) => {        
        scene.background = this.background;
        scene.fog = this.fog;

        for (const light of this.lights) {
            scene.add(light);
        }

        if (cssScene) {
            const cssPlane = new CSSPlane(
                new THREE.Vector3(-2, 1, -1),
                new THREE.Euler(0, 0, 0),
                new THREE.Vector2(512, 512),
                new THREE.Vector2(4, 4)
            );
            scene.add(cssPlane.createObject());

            const iframe = document.createElement('iframe');
            iframe.src = 'http://www.example.org';
            iframe.style.width = cssPlane.cssPixelWidth;
            iframe.style.height = cssPlane.cssPixelHeight;
            iframe.style.border = '0px';
            cssScene.add(cssPlane.createCSSObject(iframe, 0, 0, 0, 0));
            
            this.cssPlanes.push(cssPlane);
        }
    }
}