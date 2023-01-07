/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.0.9 collision-world.glb
*/

import React, { useEffect, useState } from 'react'
import * as THREE from 'three';
import { Html, useGLTF } from '@react-three/drei';
import { World } from './World';

interface WorldProps {
    world: World;
	startGame: () => void;
}

export const CollisionWorld = (props: WorldProps) => {
	const {world, startGame} = props;
	const {nodes, materials, scene} = useGLTF('/gltf/collision-world.glb');
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

		const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 0.02, 10 ), materials['Material.001']);
		mesh.position.set(1, 1, 1);
		const currMeshes: THREE.Mesh[] = [];
		currMeshes.push(mesh);
		setMeshes(currMeshes);
		
		for (const newMesh of currMeshes) {
			scene.add(newMesh);
		}

		world.octree.fromGraphNode(scene);

		startGame();
    }, [scene]);

	return (
		<group {...props} dispose={null}>
			{/* 
			// @ts-ignore */}
			<mesh geometry={nodes.Cube004.geometry} material={materials['Material.001']} position={[7.68, -5.59, 26.38]} scale={0.5} castShadow={true} receiveShadow={true} />
			{
				meshes.map(mesh => (
					<mesh key={mesh.id} geometry={mesh.geometry} material={mesh.material} position={mesh.position} castShadow={true} receiveShadow={true}/>
				))
			}
		</group>
	)
}

useGLTF.preload('/gltf/collision-world.glb');
