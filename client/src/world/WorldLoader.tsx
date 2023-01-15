import { Suspense } from "react"
import { Engine } from "../game/Engine";
import { CollisionWorld } from "./CollisionWorld";
import { MazeWorld } from './MazeWorld';
import { Crosshair } from "../game/Crosshair";

export enum WorldName {
    Collision = 'Collision',
    Maze = 'Maze'
}

interface WorldLoaderProps {
    engine: Engine;
    worldName: WorldName;
	divRef: React.RefObject<HTMLDivElement>;
	startGame: () => void;
}

export const WorldLoader = (props: WorldLoaderProps): JSX.Element => {
    const { engine, worldName, divRef, startGame } = props;

    return (
        <Suspense>
            { worldName === WorldName.Collision && <CollisionWorld world={engine.world} startGame={startGame} divRef={divRef}/> }
            { worldName === WorldName.Maze && <MazeWorld world={engine.world} startGame={startGame} divRef={divRef}/> }
            <Crosshair engine={engine}/>
        </Suspense>
    )
}