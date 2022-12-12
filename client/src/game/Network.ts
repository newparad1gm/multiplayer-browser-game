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
        Utils.setVector(player.direction, simple.direction);
    }

    updateState = (state: State) => {
        const foundPlayers: Set<string> = new Set();
        for (let [playerID, player] of Object.entries(state)) {
            foundPlayers.add(playerID);
            if (playerID === this.engine.player.playerID) {
                continue;
            }
            if (!this.engine.players.has(playerID)) {
                const newPlayerModel = Utils.createModel(new THREE.IcosahedronGeometry(.3, 5), new THREE.MeshLambertMaterial({ color: 0x88ccee }));
                const newPlayer = new Player(playerID, newPlayerModel);
                this.engine.players.set(playerID, newPlayer);
                this.engine.scene.add(newPlayerModel);
            }
            const currPlayer = this.engine.players.get(playerID);
            this.setPlayerVectors(currPlayer!, player);
        }
        for (let [playerID, player] of Array.from(this.engine.players.entries())) {
            if (!foundPlayers.has(playerID)) {
                this.engine.scene.remove(player.model);
                this.engine.players.delete(playerID);
            }
        }
    }
}