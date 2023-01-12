import React, { createRef, useCallback } from 'react';
import { Player } from '../game/Player';
import { JiraView } from './JiraView';

interface GameOptionsProps {
    player: Player;
    gameStarted: boolean;
    client: WebSocket;
}

export const GameOptions = (props: GameOptionsProps) => {
    const { player, gameStarted, client } = props;
    const nameRef = createRef<HTMLInputElement>();

    const setName = useCallback(() => {
        if (nameRef.current) {
            player.playerName = nameRef.current.value;
        }
    }, [player, nameRef]);

    return (
        <div>
            { player.isLead && !gameStarted && <GameStartOptions client={client}/> }<br/>
            { player.isLead && gameStarted && <JiraView client={client}/> }<br/>
            Name: <input type='text' ref={nameRef} defaultValue={player.playerName}/><br/>
            <button onClick={setName}>
                Set Name
            </button>
        </div>
    )
}

interface GameStartOptionsProps {
    client: WebSocket;
}

export const GameStartOptions = (props: GameStartOptionsProps) => {
    const { client } = props;
    const widthRef = createRef<HTMLInputElement>();
    const heightRef = createRef<HTMLInputElement>();

    const startGame = useCallback(() => {
        if (widthRef.current && heightRef.current) {
            client.send(JSON.stringify({ 
                start: { 
                    maze: { 
                        width: widthRef.current.value,
                        height: heightRef.current.value
                    }
                } 
            }));
        }
    }, [client, widthRef, heightRef]);

    return (
        <div>
            You are the first one here and the lead player<br/>
            Maze Size<br/>
            Width: <input type='number' min={0} max={24} defaultValue={12} ref={widthRef}/><br/>
            Height: <input type='number' min={0} max={24} defaultValue={8} ref={heightRef}/><br/>
            <button onClick={startGame}>
                Click to start
            </button>
        </div>
    )
}