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
        const stateMessage = this.engine.createStateMessage();
        this.client.send(JSON.stringify(stateMessage));
    }

    setPlayerVectors = (player: Player, simple: SimplePlayer) => {
        Utils.setVector(player.collider.end, simple.position);
        Utils.setVector(player.velocity, simple.velocity);
        Utils.setVector(player.orientation, simple.orientation);
        Utils.setVector(player.direction, simple.direction);
    }

    updateState = (state: State) => {
        if (!this.engine.scene || !this.engine.player) {
            return;
        }
        
        const foundPlayers: Set<string> = new Set();
        for (let [playerID, player] of Object.entries(state)) {
            foundPlayers.add(playerID);
            if (playerID === this.engine.player.playerID) {
                continue;
            }
            if (!this.engine.players.has(playerID)) {
                const newPlayer = new Player(playerID, 'Soldier.glb');
                newPlayer.model!.loadModel(this.engine.scene);
                this.engine.players.set(playerID, newPlayer);
            }
            const currPlayer = this.engine.players.get(playerID);
            this.setPlayerVectors(currPlayer!, player);
        }
        for (let [playerID, player] of Array.from(this.engine.players.entries())) {
            if (!foundPlayers.has(playerID) && player.model) {
                player.model.model && this.engine.scene.remove(player.model.model);
                this.engine.players.delete(playerID);
            }
        }
    }
}