import { Server as WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Utils } from './utils';
import { Player, SimpleVector, Shot, JsonResponse } from './types';
import { Maze, ClientMaze } from './maze';

export type ConnectionMessage = {
    connected: string;
    isLead: boolean;
    interval: number;
    started: boolean;
    maze?: ClientMaze;
}

export class Game {
    wsServer: WebSocketServer;

    clients: Map<string, WebSocket>;
    players: Map<string, Player>;
    leadPlayer?: string;
    leadPlayerSocket?: WebSocket;

    running: boolean;
    interval: number;
    nextRunTime: Date;

    maze: Maze;

    constructor(server: http.Server) {
        // Spinning the http server and the websocket server.
        this.wsServer = new WebSocketServer({
            server
        });
        this.startWebsocket();
        this.clients = new Map();
        this.players = new Map();
        this.interval = 50;
        try {
            this.interval = process.env.GAME_INTERVAL ? parseInt(process.env.GAME_INTERVAL) : this.interval;
        } catch (err) {
            console.log(`could not parse ${process.env.GAME_INTERVAL} for interval time, using default ${this.interval}`);
        }
        this.nextRunTime = new Date();
        this.running = false;

        this.maze = new Maze(0, 0);
    }

    sendMessage = (userID: string, json: string) => {
        this.clients.get(userID)?.send(json);
    }

    sendMessageToAll = (json: string) => {
        // We are sending the current data to all connected clients
        for (const [client, connection] of this.clients) {
            connection.send(json);
        }
    }

    startWebsocket = () => {
        this.wsServer.on('connection', (ws, request) => {
            console.log(`Received new connection from origin ${request.socket.remoteAddress}`);
            const userID = uuidv4();
            this.setConnection(ws, userID);
            const message: ConnectionMessage = { 
                connected: userID, 
                isLead: false, 
                interval: this.interval, 
                started: this.running 
            };
            if (!this.clients.size) {
                message.isLead = true;
                this.leadPlayer = userID;
            }
            this.clients.set(userID, ws);
            if (this.running) {
                message.maze = this.maze.clientMaze;
            }
            this.sendMessage(userID, JSON.stringify(message));
            console.log(`Connected ${userID} to ${request.socket.remoteAddress}`);
        });
    }

    setConnection = (connection: WebSocket, userID: string) => {
        const server = this;
        
        connection.on('message', (data, isBinary) => {
            const message = isBinary ? data : data.toString();
            try {
                const data = JSON.parse(message as string);
                if (data.player) {
                    this.setPlayerFromData(this.getOrCreatePlayer(userID), data.player);
                } else if (data.start && !this.running && userID === this.leadPlayer) {
                    this.startGame(parseInt(data.start.maze.width), parseInt(data.start.maze.height));
                }
            } catch (error) {
                console.log(`Invalid message from ${userID}: ${message}`);
            }
        });

        connection.on('close', () => {
            console.log(`Player ${userID} disconnected.`);
            server.clients.delete(userID);
            server.players.delete(userID);
            if (!server.clients.size) {
                console.log('Game stopped');
                this.running = false;
            }
        });
    }

    getOrCreatePlayer = (userID: string): Player => {
        let player = this.players.get(userID);
        if (!player) {
            player = new Player(userID);
            this.players.set(userID, player);
        }
        return player;
    }

    setPlayerFromData = (player: Player, data: JsonResponse): Player => {
        player.playerName = data.playerName;
        player.position = new SimpleVector(data.position.x, data.position.y, data.position.z);
        player.velocity = new SimpleVector(data.velocity.x, data.velocity.y, data.velocity.z);
        player.orientation = new SimpleVector(data.orientation.x, data.orientation.y, data.orientation.z);
        player.direction = new SimpleVector(data.direction.x, data.direction.y, data.direction.z);
        for (const shot of data.shots) {
            const origin = new SimpleVector(shot.origin.x, shot.origin.y, shot.origin.z);
            const direction = new SimpleVector(shot.direction.x, shot.direction.y, shot.direction.z);
            player.shots.push(new Shot(origin, direction, shot.color));
        }
        return player;
    }

    createStateMessage = () => {
        return JSON.stringify({ state: Object.fromEntries(this.players) });
    }

    startGame = async (width: number, height: number) => {
        console.log('Game starting');
        console.log(`Maze with ${width} ${height} ${typeof width} ${typeof height}`);
        this.maze = new Maze(width, height);
        this.running = true;
        this.sendMessageToAll(JSON.stringify({ 
            started: this.running,
            maze: this.maze.clientMaze
        }));
        setImmediate(() => this.run());
    }

    protected run = async () => {
        try {
            this.nextRunTime = Utils.offsetTime(Utils.now(), this.interval);
            this.sendMessageToAll(this.createStateMessage());
        } catch (err) {
            console.log(`Could not run - ${err}`);
        } finally {
            if (this.running) {
                const delay = this.nextRunTime.getTime() - Utils.now().getTime();
                await Utils.delay(delay);
                setImmediate(() => this.run());
            }
        }
    }
}