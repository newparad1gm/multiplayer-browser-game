import React, { createRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { Line } from "@react-three/drei";
import { Engine } from "./Engine";

interface CrosshairProps {
    engine: Engine
}

export const Crosshair = (props: CrosshairProps): JSX.Element => {
    const { engine } = props;
    const lines = createRef<THREE.Group>();

    useFrame(() => {
        if (lines.current && engine.camera) {
            const vector = new THREE.Vector3(0, 0, -0.8).unproject(engine.camera);
            engine.camera.add(lines.current);
            lines.current.position.set(0, 0, -0.25);
        }
    });

    return (
        <group>
            <group ref={lines}>
                <Line points={[[0.01, 0, 0], [0.05, 0, 0]]} color='white' lineWidth={5} />
                <Line points={[[0, 0.01, 0], [0, 0.05, 0]]} color='white' lineWidth={5} />
                <Line points={[[-0.01, 0, 0], [-0.05, 0, 0]]} color='white' lineWidth={5} />
                <Line points={[[0, -0.01, 0], [0, -0.05, 0]]} color='white' lineWidth={5} />
            </group>
        </group>
    )
}