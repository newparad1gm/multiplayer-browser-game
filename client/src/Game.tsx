import React, { useEffect, createRef, useCallback, useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { Player } from './game/Player';
import { Engine } from './game/Engine';
import { Network } from './game/Network';
import { MazeWorld } from './world/MazeWorld';
import { NewWindow } from './NewWindow';
import { GameOptions } from './options/GameOptions';
import './Game.css';

const WebSocketHost = process.env.REACT_APP_WEBSOCKET_CONNECTION || window.location.origin.replace(/^http/, 'ws');
const client = new WebSocket(WebSocketHost);

export const Game = (): JSX.Element => {
    const player = useMemo(() => new Player('single', 'Your Name', 'Soldier.glb'), []);
    const engine = useMemo(() => new Engine(player), [player]);
    const [ gameStarted, setGameStarted ] = useState<boolean>(false);
    const [ network, setNetwork ] = useState<Network>();
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

    const disconnectGame = useCallback(() => {
        console.log('Disconnected');
        if (network) {
            network.stopClient();
            setNetwork(undefined);
        }
    }, [network]);

    const startNetwork = useCallback((interval?: number): Network => {
        const newNetwork = new Network(client, engine, interval);
        setNetwork(newNetwork);
        return newNetwork;
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
            let currNetwork = network;
            if (messageData.hasOwnProperty('connected')) {
                player.playerID = messageData.connected;
                player.isLead = messageData.isLead;
                currNetwork = startNetwork(messageData.interval);
            } else if (messageData.hasOwnProperty('state')) {
                if (network) {
                    network.updateState(messageData.state);
                }
            }

            if (messageData.started && currNetwork) {
                const maze = messageData.maze;
                engine.world.maze.width = maze.width;
                engine.world.maze.height = maze.height;
                engine.world.maze.maze = maze.maze;
                currNetwork.startClient();
                setGameStarted(true);
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
    }, [engine.world.maze, player, network, startNetwork, disconnectGame]);

    useEffect(() => {
        if (cssRef.current) {
            const renderer = engine.startCSSRenderer();
            cssRef.current.appendChild(renderer.domElement);
        }
    }, [cssRef, engine]);

    return (
        <div style={{width: '100%'}}>
            { gameStarted && <div id='css' ref={cssRef} /> }
            { gameStarted && <div id='webgl' ref={glRef}>
                <Canvas onCreated={({gl, scene, camera}) => {
                    engine.camera = camera as THREE.PerspectiveCamera;
                    engine.renderer = gl;
                    engine.world.scene = scene;
                }}>
                    <Suspense>
                        <MazeWorld world={engine.world} startGame={startGame} divRef={divRef}/>
                    </Suspense>
                </Canvas>
            </div> }
            <div id='hud' ref={divRef}/>
            <NewWindow>
                <GameOptions player={player} client={client} gameStarted={gameStarted}/>
            </NewWindow>
        </div>
    )
}