import { Server as WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Utils } from './utils';
import { Player, SimpleVector, Shot, JsonResponse, ConnectionMessage } from './types';
import { Maze } from './maze';

export class Game {
    wsServer: WebSocketServer;

    clients: Map<string, WebSocket>;
    players: Map<string, Player>;
    leadPlayer?: string;
    leadPlayerSocket?: WebSocket;

    running: boolean;
    interval: number;
    nextRunTime: Date;

    world: string;
    screenPos: SimpleVector;
    screenDimensions: SimpleVector;
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

        this.world = '';
        this.screenPos = new SimpleVector(0, 0, 0);
        this.screenDimensions = new SimpleVector(0, 0, 0);
        this.maze = new Maze(0, 0, 0, true);
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
                world: this.world,
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
                message.screenPos = this.screenPos,
                message.screenDimensions = this.screenDimensions,
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
                    this.startGame(data.start);
                } else if (data.screenData && userID === this.leadPlayer) {
                    this.sentScreenData(data.screenData);
                } else if (data.clearWorld && userID === this.leadPlayer) {
                    this.sendMessageToAll(JSON.stringify({ clearWorld: true}));
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

    sentScreenData = (data: JsonResponse) => {
        console.log(`sending screen data ${JSON.stringify(data)}`);
        this.sendMessageToAll(JSON.stringify({
            screenData: data
        }));
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
        player.position.setVector(data.position.x, data.position.y, data.position.z);
        player.velocity.setVector(data.velocity.x, data.velocity.y, data.velocity.z);
        player.orientation.setVector(data.orientation.x, data.orientation.y, data.orientation.z);
        player.direction.setVector(data.direction.x, data.direction.y, data.direction.z);
        player.shots = data.shots || [];
        return player;
    }

    createStateMessage = () => {
        return JSON.stringify({ state: Object.fromEntries(this.players) });
    }

    startGame = async (start: JsonResponse) => {
        console.log(`Game starting with map ${start.world}`);
        this.world = start.world;
        this.screenDimensions.setVector(start.screenDimensions.x, start.screenDimensions.y, start.screenDimensions.z);
        this.screenPos.setVector(start.screenPos.x, start.screenPos.y, start.screenPos.z);
        if (start.world === 'Maze') {
            const width = parseInt(start.maze.width);
            const height = parseInt(start.maze.height);
            const boxMode = start.maze.boxMode;
            console.log(`Maze with ${width} ${height} and boxMode: ${boxMode}`);
            this.maze = new Maze(width, height, this.screenDimensions.y, boxMode);
        }
        this.running = true;
        const startMessage: ConnectionMessage = {
            started: this.running,
            world: this.world,
            maze: this.maze.clientMaze,
            screenDimensions: this.screenDimensions,
            screenPos: this.screenPos
        }
        this.sendMessageToAll(JSON.stringify(startMessage));
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