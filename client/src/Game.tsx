import React, { useEffect, createRef, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { Player } from './game/Player';
import { Engine } from './game/Engine';
import { Network } from './game/Network';
import { CollisionWorld } from './world/CollisionWorld';
import { MazeWorld } from './world/MazeWorld';
import { Canvas } from '@react-three/fiber';
import './Game.css';

const WebSocketHost = process.env.REACT_APP_WEBSOCKET_CONNECTION || window.location.origin.replace(/^http/, 'ws');
const client = new WebSocket(WebSocketHost);

export const Game = (): JSX.Element => {
    const player = new Player('single', 'Soldier.glb');
    const engine = new Engine(player);
    const guiRef = useRef<GUI>();
    const networkRef = useRef<Network>();
    const containerRef = createRef<HTMLDivElement>();
    const cssRef = createRef<HTMLDivElement>();

    const initContainer = () => {
        if (containerRef.current && engine.controls) {
            const container = containerRef.current;
            container.appendChild(engine.stats.domElement);

            engine.controls.addControls(document, engine.shoot);
            container.addEventListener('mousedown', () => {
                document.body.requestPointerLock();
                if (engine.controls) {
                    engine.controls.mouseTime = performance.now();
                }
            });
        }
    }

    const connectPlayer = () => {
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
                    player.playerID = messageData.connected;
                    engine.world.maze.width = messageData.maze.width;
                    engine.world.maze.height = messageData.maze.height;
                    engine.world.maze.maze = messageData.maze.maze;
                    startNetwork(messageData.interval);
                }
            } else if (messageData.hasOwnProperty('state')) {
                if (networkRef.current) {
                    networkRef.current.updateState(messageData.state);
                }
            }
        };

        client.onerror = (error) => {
            console.log('Error on connection');
            console.log(error);
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
        const network = new Network(client, engine, interval);
        network.startClient();
        networkRef.current = network;
    }

    const startGame = () => {
        guiRef.current = new GUI({ width: 200 });
        guiRef.current.add({ debug: false}, 'debug')
            .onChange((value: boolean) => {
                engine.world.helper.visible = value;
            });

        engine.startGame();
        initContainer();

        const onWindowResize = () => {
            if (engine.camera && engine.renderer) {
                const renderer = engine.renderer;
                const cssRenderer = engine.cssRenderer;
                const camera = engine.camera;

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
    
                renderer.setSize(window.innerWidth, window.innerHeight);
                if (cssRenderer) {
                    cssRenderer.setSize(window.innerWidth, window.innerHeight);
                }
            }
        };
        window.addEventListener('resize', onWindowResize);
    }

    useEffect(() => {
        connectPlayer();
    }, []);

    useEffect(() => {
        if (cssRef.current) {
            const renderer = engine.startCSSRenderer();
            cssRef.current.appendChild(renderer.domElement);
        }
    }, [cssRef]);

    return (
        <div>
            <div id='info'>
                MOUSE to look around<br/>
                WASD to move and SPACE to jump
            </div>
            <div id='css' ref={cssRef} />
            <div id='webgl' ref={containerRef}>
                <Canvas onCreated={({gl, scene, camera}) => {
                    engine.camera = camera as THREE.PerspectiveCamera;
                    engine.renderer = gl;
                    engine.scene = scene;
                }}>
                    <Suspense>
                        <MazeWorld world={engine.world} startGame={startGame} />
                    </Suspense>
                </Canvas>
            </div>
        </div>
    )
}