/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.0.9 collision-world.glb
*/

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { World } from './World';
import { CSSPlane } from '../game/CSSPlane';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

interface WorldProps {
    world: World;
	startGame: () => void;
	divRef: React.RefObject<HTMLDivElement>;
}

export const MazeWorld = (props: WorldProps) => {
	const { world, startGame, divRef } = props;
	const { materials } = useGLTF('/gltf/collision-world.glb');
	const sceneRef = useRef<THREE.Scene>(null);
	const background = useLoader(RGBELoader, '/textures/royal_esplanade_1k.hdr');

    useEffect(() => {
		if (background) {
			background.mapping = THREE.EquirectangularReflectionMapping;
			world.background = background;
			world.environment = background;
			world.fog = new THREE.Fog(0x88ccee, 0, 50);

			const fillLight = new THREE.HemisphereLight(0x4488bb, 0x002244, 0.5);
			fillLight.position.set(2, 1, 1);
			world.lights.push(fillLight);

			const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
			directionalLight.position.set(-5, 25, -1);
			directionalLight.castShadow = true;
			directionalLight.shadow.camera.near = 0.01;
			directionalLight.shadow.camera.far = 500;
			directionalLight.shadow.camera.right = 30;
			directionalLight.shadow.camera.left = -30;
			directionalLight.shadow.camera.top	= 30;
			directionalLight.shadow.camera.bottom = -30;
			directionalLight.shadow.mapSize.width = 1024;
			directionalLight.shadow.mapSize.height = 1024;
			directionalLight.shadow.radius = 4;
			directionalLight.shadow.bias = -0.00006;
			world.lights.push(directionalLight);

			startGame();
		}
    }, [background, startGame, world]);

	useEffect(() => {
		if (materials) {
			const currMeshes: THREE.Mesh[] = [];
			const maze = world.maze;
			const floor = new THREE.Mesh(new THREE.BoxGeometry(maze.rows * 4, 0.02, maze.cols - 0.5), materials['Material.001']);
			floor.position.set(0, 0, (maze.cols / 2) - 0.5);
			floor.castShadow = true;
			floor.receiveShadow = true;
			currMeshes.push(floor);
			const mazeMesh = maze.generateMazeMesh(materials['Material.001']);
			mazeMesh.castShadow = true;
			mazeMesh.receiveShadow = true;
			mazeMesh.position.set(0, 0, 0);
			currMeshes.push(mazeMesh);
			
			for (const newMesh of currMeshes) {
				world.worldScene.add(newMesh);
			}
			
			world.octree.fromGraphNode(world.worldScene);
		}
	}, [materials, world.maze, world.octree, world.worldScene]);

	useEffect(() => {
		const addJiraIssues = async () => {
			if (world.cssScene && divRef.current) {
				const maze = world.maze;
				const cssPlane = new CSSPlane(
					new THREE.Vector3(maze.cols, 5, maze.rows),
					new THREE.Euler(0, -(Math.PI / 2), 0),
					new THREE.Vector2(maze.cols * 64, 640),
					new THREE.Vector2(maze.cols, 10)
				);
				world.worldScene.add(cssPlane.createObject());
	
				const iframe = document.createElement('iframe');
				iframe.src = 'http://www.example.org';
				iframe.style.width = cssPlane.cssPixelWidth;
				iframe.style.height = cssPlane.cssPixelHeight;
				iframe.style.border = '0px';
	
				divRef.current.append(iframe);
				//const sprints = await api.activeSprints('107');
				//divRef.current.append(JSON.stringify(sprints));
				/*const div = document.createElement('div');
                const response = await fetch('https://haventech.atlassian.net/rest/agile/1.0/sprint/3564/issue');
                const issues = await response.json();
                div.append(issues);*/
				world.cssScene.add(cssPlane.createCSSObject(divRef.current));
				
				world.cssPlanes.push(cssPlane);
			}
		}

		addJiraIssues();
	}, [world.cssPlanes, world.cssScene, world.maze, world.worldScene, divRef]);

	useEffect(() => {
		if (sceneRef.current) {
			sceneRef.current.add(world.worldScene);
		}
	}, [sceneRef, world.worldScene]);

	return (
		<group {...props} dispose={null}>
			<scene ref={sceneRef}/>
		</group>
	)
}

useGLTF.preload('/gltf/collision-world.glb');
