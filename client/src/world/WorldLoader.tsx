import { Suspense } from "react"
import { World } from './World';
import { CollisionWorld } from "./CollisionWorld";
import { MazeWorld } from './MazeWorld';

export enum WorldName {
    Collision = 'Collision',
    Maze = 'Maze'
}

interface WorldLoaderProps {
    world: World;
    worldName: WorldName;
	divRef: React.RefObject<HTMLDivElement>;
	startGame: () => void;
}

export const WorldLoader = (props: WorldLoaderProps): JSX.Element => {
    const { world, worldName, divRef, startGame } = props;

    return (
        <Suspense>
            { worldName === WorldName.Collision && <CollisionWorld world={world} startGame={startGame} divRef={divRef}/> }
            { worldName === WorldName.Maze && <MazeWorld world={world} startGame={startGame} divRef={divRef}/> }
        </Suspense>
    )
}