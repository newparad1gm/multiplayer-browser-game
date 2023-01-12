import * as THREE from 'three';
import { Engine } from './Engine';
import { Player } from './Player';
import { Utils } from '../Utils';
import { SimplePlayer, State } from '../Types';

export class Network {
    client: WebSocket;
    engine: Engine;
    interval: number;
    nextRunTime: Date;
    running: boolean;

    constructor(client: WebSocket, engine: Engine, interval?: number) {
        this.client = client;
        this.engine = engine;
        this.interval = interval || 100;
        this.nextRunTime = new Date();
        this.running = false;
    }

    startClient = () => {
        console.log(`Client started with interval ${this.interval}`);
        this.running = true;
        setTimeout(() => this.runClient(), this.interval);
    }

    runClient = async () => {
        while (true) {
            try {
                this.nextRunTime = Utils.offsetTime(Utils.now(), this.interval);
                this.sendToServer();
            } catch (err) {
                console.log(`Could not run - ${err}`);
            } finally {
                if (this.running) {
                    const delay = this.nextRunTime.getTime() - Utils.now().getTime();
                    await Utils.delay(delay);
                } else {
                    break;
                }
            }
        }
    }

    stopClient = () => {
        this.running = false;
    }

    sendToServer = () => {
        const stateMessage = { player: this.engine.createStateMessage() };
        this.client.send(JSON.stringify(stateMessage));
    }

    setPlayer = (player: Player, simple: SimplePlayer) => {
        player.playerName = simple.playerName;
        Utils.setVector(player.collider.end, simple.position);
        Utils.setVector(player.velocity, simple.velocity);
        Utils.setVector(player.orientation, simple.orientation);
        Utils.setVector(player.direction, simple.direction);

        for (const shot of simple.shots) {
            this.engine.raycaster.set(new THREE.Vector3(shot.origin.x, shot.origin.y, shot.origin.z), new THREE.Vector3(shot.direction.x, shot.direction.y, shot.direction.z));
            this.engine.splatter(shot.color, this.engine.raycaster);
        }
    }

    updateState = (state: State) => {
        if (!this.engine.world.scene || !this.engine.player) {
            return;
        }
        
        const foundPlayers: Set<string> = new Set();
        for (let [playerID, player] of Object.entries(state)) {
            foundPlayers.add(playerID);
            if (playerID === this.engine.player.playerID) {
                continue;
            }
            if (!this.engine.players.has(playerID)) {
                const newPlayer = new Player(playerID, player.playerName, 'Soldier.glb');
                newPlayer.loadPlayer(this.engine.world.scene);
                this.engine.players.set(playerID, newPlayer);
            }
            const currPlayer = this.engine.players.get(playerID);
            this.setPlayer(currPlayer!, player);
        }
        for (let [playerID, player] of Array.from(this.engine.players.entries())) {
            if (!foundPlayers.has(playerID) && player.model) {
                player.removePlayer(this.engine.world.scene);
                this.engine.players.delete(playerID);
            }
        }
    }
}