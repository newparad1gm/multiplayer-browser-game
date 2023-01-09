import React, { useEffect, createRef, useCallback, useMemo, useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { Player } from './game/Player';
import { Engine } from './game/Engine';
import { Network } from './game/Network';
import { MazeWorld } from './world/MazeWorld';
import { Canvas } from '@react-three/fiber';
import './Game.css';

const WebSocketHost = process.env.REACT_APP_WEBSOCKET_CONNECTION || window.location.origin.replace(/^http/, 'ws');
const client = new WebSocket(WebSocketHost);

export const Game = (): JSX.Element => {
    const player = useMemo(() => new Player('single', 'Soldier.glb'), []);
    const [playerLead, setPlayerLead] = useState<boolean>(true);
    const engine = useMemo(() => new Engine(player), [player]);
    const networkRef = useRef<Network>();
    const gameRef = createRef<HTMLDivElement>();
    const glRef = createRef<HTMLDivElement>();
    const cssRef = createRef<HTMLDivElement>();
    const divRef = createRef<HTMLDivElement>();
    
    const initContainer = () => {
        if (glRef.current && engine.controls) {
            const container = glRef.current;
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

    const disconnectGame = () => {
        console.log('Disconnected');
        if (networkRef.current) {
            networkRef.current.stopClient();
            networkRef.current = undefined;
        }
    }

    const startNetwork = useCallback((interval?: number) => {
        const network = new Network(client, engine, interval);
        network.startClient();
        networkRef.current = network;
    }, [engine]);

    const startGame = () => {
        const gui = new GUI({ width: 200 });
        gui.add({ debug: false }, 'debug')
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
                player.playerID = messageData.connected;
                setPlayerLead(messageData.isLead);
                if (!networkRef.current) {
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
    }, [engine.world.maze, player, startNetwork]);

    useEffect(() => {
        if (gameRef.current && !playerLead) {
            gameRef.current.style.width = '100%';
        }
    }, [gameRef, playerLead]);

    useEffect(() => {
        if (cssRef.current) {
            const renderer = engine.startCSSRenderer();
            cssRef.current.appendChild(renderer.domElement);
        }
    }, [cssRef, engine]);

    return (
        <div style={{width: '100%'}}>
            <div id='game' ref={gameRef}>
                <div id='css' ref={cssRef} />
                <div id='webgl' ref={glRef}>
                    <Canvas onCreated={({gl, scene, camera}) => {
                        engine.camera = camera as THREE.PerspectiveCamera;
                        engine.renderer = gl;
                        engine.world.scene = scene;
                    }}>
                        <Suspense>
                            <MazeWorld world={engine.world} startGame={startGame} divRef={divRef} playerLead={playerLead}/>
                        </Suspense>
                    </Canvas>
                </div>
            </div>
            <div id='hud' ref={divRef}>
            </div>
        </div>
    )
}