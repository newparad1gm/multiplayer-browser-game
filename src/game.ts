import { server as WebSocketServer, connection } from 'websocket';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Utils } from './utils';
import { Player, SimpleVector } from './types';

const defaultWebSocketPort = 8000;

export class Game {
    server: http.Server;
    wsServer: WebSocketServer;

    clients: Map<string, connection>;
    players: Map<string, Player>;

    running: boolean;
    interval: number;
    nextRunTime: Date;

    constructor() {
        // Spinning the http server and the websocket server.
        let webSocketsServerPort: number = defaultWebSocketPort;
        try {
            webSocketsServerPort = parseInt(process.env.WEBSOCKET_PORT!);
        } catch (e) {
            console.log('Could not parse websocket port');
        }
        this.server = http.createServer();
        this.server.listen(webSocketsServerPort || defaultWebSocketPort);
        this.wsServer = new WebSocketServer({
            httpServer: this.server
        });
        this.clients = new Map();
        this.players = new Map();
        this.interval = 100;
        try {
            this.interval = process.env.GAME_INTERVAL ? parseInt(process.env.GAME_INTERVAL) : this.interval;
        } catch (err) {
            console.log(`could not parse ${process.env.GAME_INTERVAL} for interval time, using default ${this.interval}`);
        }
        this.nextRunTime = new Date();
        this.running = false;
    }

    sendMessage = (userID: string, json: string) => {
        this.clients.get(userID)?.sendUTF(json);
    }

    sendMessageToAll = (json: string) => {
        // We are sending the current data to all connected clients
        for (const [client, connection] of this.clients) {
            connection.sendUTF(json);
        }
    }
      
    startWebsocket = () => {
        this.wsServer.on('request', (request) => {
            console.log(`Received new connection from origin ${request.origin}`);
            const userID = uuidv4();
            const connection = request.accept(null, request.origin);
            this.setConnection(connection, userID);
            this.clients.set(userID, connection);
            this.sendMessage(userID, JSON.stringify({ connected: userID, interval: this.interval }));
            console.log(`Connected ${userID} to ${request.origin}`);
        })
    }

    setConnection = (connection: connection, userID: string) => {
        const server = this;
        
        connection.on('message', (message) => {
            if (message.type === 'utf8') {
                this.players.set(userID, this.parsePlayerMessage(userID, message.utf8Data));
                if (!this.running) {
                    this.startGame();
                }
            }
        });

        connection.on('close', (connection) => {
            console.log("Player " + userID + " disconnected.");
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
        player.direction = new SimpleVector(data.direction.x, data.direction.y, data.direction.z);
        return player;
    }

    createStateMessage = () => {
        return JSON.stringify({ state: Object.fromEntries(this.players) });
    }

    startGame = () => {
        console.log('Game starting');
        this.running = true;
        setTimeout(() => this.run(), this.interval);
    }

    protected run = async () => {
        while (true) {
            try {
                this.nextRunTime = Utils.offsetTime(Utils.now(), this.interval);
                this.sendMessageToAll(this.createStateMessage());
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
}