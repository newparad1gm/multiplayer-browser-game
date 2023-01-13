import React, { createRef, useCallback } from 'react';
import { Player } from '../game/Player';
import { WorldName } from '../world/WorldLoader';
import { JiraView } from './JiraView';
import { Utils } from '../Utils';
import { StartMessage } from '../Types';

interface GameOptionsProps {
    player: Player;
    gameStarted: boolean;
    worldName: WorldName;
    setWorldName: React.Dispatch<React.SetStateAction<WorldName>>;
    client: WebSocket;
}

export const GameOptions = (props: GameOptionsProps): JSX.Element => {
    const { player, gameStarted, worldName, setWorldName, client } = props;
    const nameRef = createRef<HTMLInputElement>();

    const setName = useCallback(() => {
        if (nameRef.current) {
            player.playerName = nameRef.current.value;
        }
    }, [player, nameRef]);

    return (
        <div>
            { player.isLead && !gameStarted && <GameStartOptions worldName={worldName} setWorldName={setWorldName} client={client}/> }<br/>
            { player.isLead && gameStarted && <JiraView client={client}/> }<br/>
            Name: <input type='text' ref={nameRef} defaultValue={player.playerName}/><br/>
            <button onClick={setName}>
                Set Name
            </button>
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

    const startGame = useCallback(() => {
        if (Utils.checkEnum(WorldName, worldName)) {
            const message: StartMessage = {
                start: {
                    world: worldName
                }
            }
            let sendMessage = false;
            if (worldName === WorldName.Maze) {
                if (widthRef.current && heightRef.current) {
                    message.start.maze = {
                        width: widthRef.current.value,
                        height: heightRef.current.value
                    }
                    sendMessage = true;
                }
            } else {
                sendMessage = true;
            }

            sendMessage && client.send(JSON.stringify(message));
        }
    }, [client, widthRef, heightRef, worldName]);

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
                Maze Size<br/>
                Width: <input type='number' min={0} max={24} defaultValue={12} ref={widthRef}/><br/>
                Height: <input type='number' min={0} max={24} defaultValue={8} ref={heightRef}/><br/>
            </div> ) }
            <button onClick={startGame}>
                Click to start
            </button>
        </div>
    )
}