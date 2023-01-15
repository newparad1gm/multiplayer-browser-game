import React, { createRef, useCallback } from 'react';
import { WorldName } from '../world/WorldLoader';
import { JiraView } from './JiraView';
import { Utils } from '../Utils';
import { StartMessage } from '../Types';
import { Engine } from '../game/Engine';

interface GameOptionsProps {
    engine: Engine;
    gameStarted: boolean;
    worldName: WorldName;
    setWorldName: React.Dispatch<React.SetStateAction<WorldName>>;
    client: WebSocket;
}

export const GameOptions = (props: GameOptionsProps): JSX.Element => {
    const { engine, gameStarted, worldName, setWorldName, client } = props;
    const nameRef = createRef<HTMLInputElement>();

    const setName = useCallback(() => {
        if (nameRef.current) {
            engine.player.playerName = nameRef.current.value;
        }
    }, [engine, nameRef]);

    const clearWorld = useCallback(() => {
        engine.clearSplatters();
        if (engine.player.isLead) {
            client.send(JSON.stringify({ clearWorld: true }));
        }
    }, [client, engine]);

    return (
        <div>
            { engine.player.isLead && !gameStarted && <GameStartOptions worldName={worldName} setWorldName={setWorldName} client={client}/> }<br/>
            { engine.player.isLead && gameStarted && <JiraView client={client}/> }<br/>
            Name: <input type='text' ref={nameRef} defaultValue={engine.player.playerName}/><br/>
            <button onClick={setName}>
                Set Name
            </button><br/>
            <button onClick={clearWorld}>
                Clear World
            </button><br/>
        </div>
    )
}

interface GameStartOptionsProps {
    worldName: WorldName;
    setWorldName: React.Dispatch<React.SetStateAction<WorldName>>;
    client: WebSocket;
}

export const GameStartOptions = (props: GameStartOptionsProps): JSX.Element => {
    const { worldName, setWorldName, client } = props;
    const widthRef = createRef<HTMLInputElement>();
    const heightRef = createRef<HTMLInputElement>();
    const screenWidthRef = createRef<HTMLInputElement>();
    const screenHeightRef = createRef<HTMLInputElement>();
    const boxModeRef = createRef<HTMLInputElement>();
    const screenPosX = createRef<HTMLInputElement>();
    const screenPosY = createRef<HTMLInputElement>();

    const startGame = useCallback(() => {
        if (Utils.checkEnum(WorldName, worldName)) {
            const message: StartMessage = {
                start: {
                    world: worldName
                }
            }
            let sendMessage = false;
            if (worldName === WorldName.Maze) {
                if (widthRef.current && heightRef.current && boxModeRef.current) {
                    message.start.maze = {
                        width: parseInt(widthRef.current.value),
                        height: parseInt(heightRef.current.value),
                        boxMode: boxModeRef.current.checked,
                    }
                    sendMessage = true;
                }
            } else {
                sendMessage = true;
            }

            if (screenWidthRef.current && screenHeightRef.current && screenPosX.current && screenPosY.current) {
                const screenHeight = parseInt(screenHeightRef.current.value);
                message.start.screenDimensions = { x: parseInt(screenWidthRef.current.value), y: screenHeight, z: 0 };
                message.start.screenPos = { x: parseInt(screenPosX.current.value), y: screenHeight / 2, z: parseInt(screenPosY.current.value) };
                sendMessage = sendMessage && true;
            }

            sendMessage && client.send(JSON.stringify(message));
        }
    }, [client, widthRef, heightRef, boxModeRef, screenWidthRef, screenHeightRef, screenPosX, screenPosY, worldName]);

    return (
        <div>
            You are the first one here and the lead player<br/>
            Select World<br/>
            <select value={worldName} onChange={e => setWorldName(WorldName[e.target.value as keyof typeof WorldName])}>
                { Utils.getEnumKeys(WorldName).map((key, i) => (
                    <option key={i} value={WorldName[key]}>
                        {key}
                    </option>
                )) }
            </select>
            { worldName === WorldName.Maze && ( <div>
                <div>Maze Size - Width: <input type='number' min={0} max={24} defaultValue={12} ref={widthRef}/> Length: <input type='number' min={0} max={24} defaultValue={8} ref={heightRef}/></div>
                <div>Box Mode: <input type='checkbox' ref={boxModeRef}/> </div>
            </div> ) }
            <div>Screen Dimensions - Width: <input type='number' min={8} max={50} defaultValue={30} ref={screenWidthRef}/> Height: <input type='number' min={8} max={24} defaultValue={15} ref={screenHeightRef}/></div>
            <div>Screen Position - X: <input type='number' min={-24} max={24} defaultValue={30} ref={screenPosX}/> Y: <input type='number' min={-24} max={24} defaultValue={0} ref={screenPosY}/></div>
            <button onClick={startGame}>
                Click to start
            </button>
        </div>
    )
}