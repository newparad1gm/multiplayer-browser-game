/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.0.9 collision-world.glb
*/

import React, { useEffect, useState } from 'react'
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { World } from './World';
import { MazeObjects } from './Maze'

interface WorldProps {
    world: World;
	startGame: () => void;
}

export const MazeWorld = (props: WorldProps) => {
	const {world, startGame} = props;
	const {materials} = useGLTF('/gltf/collision-world.glb');
	const [scene, setScene] = useState<THREE.Scene>(new THREE.Scene());
	const [meshes, setMeshes] = useState<THREE.Mesh[]>([]);

    useEffect(() => {
        world.background = new THREE.Color(0x88ccee);
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
    }, []);

	useEffect(() => {
		const currMeshes: THREE.Mesh[] = [];
		const maze = world.maze;
		const floor = new THREE.Mesh(new THREE.BoxGeometry(maze.width*10, 0.02, maze.height*10), materials['Material.001']);
		floor.position.set(0, 0, 0);
		currMeshes.push(floor);
		maze.maze.forEach((row, r) => {
			row.forEach((cell, c) => {
				if (cell === MazeObjects.Wall) {
					const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), materials['Material.001']);
					wall.position.set(r, 1, c);
					currMeshes.push(wall);
				}
			})
		})
		setMeshes(currMeshes);
		
		const currScene = new THREE.Scene();
		for (const newMesh of currMeshes) {
			currScene.add(newMesh);
		}
		setScene(currScene);

		world.octree.fromGraphNode(currScene);
	}, [world.maze]);

	return (
		<group {...props} dispose={null}>
			{
				meshes.map(mesh => (
					<mesh key={mesh.id} geometry={mesh.geometry} material={mesh.material} position={mesh.position} castShadow={true} receiveShadow={true}/>
				))
			}
		</group>
	)
}

useGLTF.preload('/gltf/collision-world.glb');
