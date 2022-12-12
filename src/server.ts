import express from 'express';
import path from 'path';
import { Game } from './game';

const expressPort = 5000;

export class Server {
    expressServer: express.Express;
    game: Game;

    constructor() {
        this.expressServer = express();
        this.game = new Game();
    }

    startServer = () => {
        this.expressServer.use(express.static(path.join(__dirname, '../client/build')));
        this.expressServer.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
        });
        this.expressServer.listen(expressPort);
        this.game.startWebsocket();
    }
}