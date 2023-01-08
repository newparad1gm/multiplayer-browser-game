import * as THREE from 'three';
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper";
import { Octree } from "three/examples/jsm/math/Octree";
import { CSSPlane } from '../game/CSSPlane';
import { Maze } from './Maze';
import { Model } from '../Types';
import { Utils } from '../Utils';

export class World {
    NUM_SPHERES: number = 100;
    SPHERE_RADIUS: number = 0.2;

    lights: THREE.Light[];
    background: THREE.Color | THREE.Texture | null = null;
    fog: THREE.FogBase | null = null;
    octree: Octree;
    helper: OctreeHelper;
    cssPlanes: CSSPlane[];
    maze: Maze;
    
    scene?: THREE.Scene;
    cssScene?: THREE.Scene;
    worldScene: THREE.Scene;

    spheres: Model[];
    sphereIdx = 0;

    constructor() {
        this.lights = [];
        this.octree = new Octree();
        this.helper = new OctreeHelper(this.octree, new THREE.Color(0x88ccee));
        this.helper.visible = false;
        this.cssPlanes = [];
        this.maze = new Maze(10, 10);
        this.spheres = [];
        this.worldScene = new THREE.Scene();
    }

    renderCSSPlanes = () => {
        if (this.scene) {
            for (const plane of this.cssPlanes) {
                plane.renderObject(this.scene);
            }
        }
    }

    createSpheres = () => {
        if (!this.scene) {
            return;
        }

        const sphereGeometry = new THREE.IcosahedronGeometry(this.SPHERE_RADIUS, 5);
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xbbbb44 });

        for (let i = 0; i < this.NUM_SPHERES; i++) {
            const sphere = Utils.createModel(sphereGeometry, sphereMaterial);
            this.scene.add(sphere);

            this.spheres.push({
                mesh: sphere,
                collider: new THREE.Sphere(new THREE.Vector3(0, - 100, 0), this.SPHERE_RADIUS),
                velocity: new THREE.Vector3()
            });
        }
    }

    startScene = () => {
        if (!this.scene) {
            return;
        }

        this.scene.background = this.background;
        this.scene.fog = this.fog;

        for (const light of this.lights) {
            this.scene.add(light);
        }

        if (this.cssScene) {
            const cssPlane = new CSSPlane(
                new THREE.Vector3(-2, 1, -1),
                new THREE.Euler(0, 0, 0),
                new THREE.Vector2(512, 512),
                new THREE.Vector2(4, 4)
            );
            this.worldScene.add(cssPlane.createObject());

            const iframe = document.createElement('iframe');
            iframe.src = 'http://www.example.org';
            iframe.style.width = cssPlane.cssPixelWidth;
            iframe.style.height = cssPlane.cssPixelHeight;
            iframe.style.border = '0px';
            this.cssScene.add(cssPlane.createCSSObject(iframe, 0, 0, 0, 0));
            
            this.cssPlanes.push(cssPlane);
        }
    }
}