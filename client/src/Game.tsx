import React, { useEffect, createRef, useRef } from 'react';
import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { Player } from './game/Player';
import { Engine } from './game/Engine';
import { World } from './game/World';
import { Utils } from './Utils';
import { Network } from './game/Network';

const client = new W3CWebSocket(process.env.REACT_APP_WEBSOCKET_CONNECTION!);

export const Game = (): JSX.Element => {
    const containerRef = createRef<HTMLDivElement>();
    const engineRef = useRef<Engine>();
    const guiRef = useRef<GUI>();
    const runningRef = useRef<boolean>();
    const networkRef = useRef<Network>();

    // constants
    const PLAYER_SPHERE_RADIUS = 0.3;

    const initContainer = () => {
        if (containerRef.current && engineRef.current) {
            const container = containerRef.current;
            const engine = engineRef.current;
        
            container.appendChild(engine.renderer.domElement);
            container.appendChild(engine.stats.domElement);

            engine.controls.addControls(document, engine.throwBall);
            container.addEventListener('mousedown', () => {
                document.body.requestPointerLock();
                engine.controls.mouseTime = performance.now();
            });
        }
    }

    const createPlayer = () => {
        client.onopen = () => {
            console.log('Connected');
        };

        client.onmessage = (message) => {
            let messageData;
            try {
                messageData = JSON.parse(message.data as string);
            } catch (e) {
                messageData = JSON.parse(JSON.stringify(message.data));
            }
            if (messageData.hasOwnProperty('connected')) {
                if (!networkRef.current) {
                    runningRef.current = true;
                    const playerModel = Utils.createModel(new THREE.IcosahedronGeometry(PLAYER_SPHERE_RADIUS, 5), new THREE.MeshLambertMaterial({ color: 0x88ccee }));
                    startGame(new Player(messageData.connected, playerModel));
                    startNetwork(messageData.interval);
                }
            } else if (messageData.hasOwnProperty('state')) {
                if (networkRef.current) {
                    networkRef.current.updateState(messageData.state);
                }
            }
        };

        client.onerror = () => {
            disconnectGame();
        }

        client.onclose = () => {
            disconnectGame();
        }
    }

    const disconnectGame = () => {
        console.log('Disconnected');
        if (networkRef.current) {
            networkRef.current.stopClient();
            networkRef.current = undefined;
        }
    }

    const startNetwork = (interval?: number) => {
        if (engineRef.current) {
            const network = new Network(client, engineRef.current, interval);
            network.startClient();
            networkRef.current = network;
        }
    }

    const createWorld = (): World => {
        const world = new World('collision-world.glb');

        world.background = new THREE.Color(0x88ccee);
        world.fog = new THREE.Fog(0x88ccee, 0, 50);

        const fillLight1 = new THREE.HemisphereLight(0x4488bb, 0x002244, 0.5);
        fillLight1.position.set(2, 1, 1);
        world.lights.push(fillLight1);

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

        return world;
    }

    const startGame = (player: Player, interval?: number) => {
        const world = createWorld();

        engineRef.current = new Engine(player, world);

        guiRef.current = new GUI({ width: 200 });
        guiRef.current.add({ debug: false}, 'debug')
            .onChange((value: boolean) => {
                world.helper.visible = value;
            });

        initContainer();

        const onWindowResize = () => {
            if (engineRef.current) {
                const renderer = engineRef.current.renderer;
                const camera = engineRef.current.camera;

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
    
                renderer.setSize( window.innerWidth, window.innerHeight );
            }
        };
        window.addEventListener('resize', onWindowResize);
    }

    useEffect(() => {
        createPlayer();
    }, []);

    return (
        <div>
            <div id="info">
                MOUSE to look around<br/>
                WASD to move and SPACE to jump
            </div>
            <div ref={containerRef} id="container"></div>
        </div>
    )
}