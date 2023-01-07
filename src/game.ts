import { Server as WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Utils } from './utils';
import { Player, SimpleVector } from './types';
import { Maze } from './maze';

export class Game {
    wsServer: WebSocketServer;

    clients: Map<string, WebSocket>;
    players: Map<string, Player>;

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

        this.maze = new Maze(12, 8);
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
            this.clients.set(userID, ws);
            if (!this.running) {
                this.startGame();
            }
            this.sendMessage(userID, JSON.stringify({ connected: userID, interval: this.interval, maze: this.maze.clientMaze }));
            console.log(`Connected ${userID} to ${request.socket.remoteAddress}`);
        });
    }

    setConnection = (connection: WebSocket, userID: string) => {
        const server = this;
        
        connection.on('message', (data, isBinary) => {
            const message = isBinary ? data : data.toString();
            this.players.set(userID, this.parsePlayerMessage(userID, message as string));
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

    parsePlayerMessage = (userID: string, message: string): Player => {
        const data = JSON.parse(message);
        const player = new Player(userID);
        player.position = new SimpleVector(data.position.x, data.position.y, data.position.z);
        player.velocity = new SimpleVector(data.velocity.x, data.velocity.y, data.velocity.z);
        player.orientation = new SimpleVector(data.orientation.x, data.orientation.y, data.orientation.z);
        player.direction = new SimpleVector(data.direction.x, data.direction.y, data.direction.z);
        return player;
    }

    createStateMessage = () => {
        return JSON.stringify({ state: Object.fromEntries(this.players) });
    }

    startGame = () => {
        console.log('Game starting');
        this.maze = new Maze(12, 8);
        this.running = true;
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