import express from 'express';
import path from 'path';
import { Game } from './game';

export class Server {
    expressServer: express.Express;
    game: Game;

    constructor() {
        this.expressServer = express();
        this.game = new Game();
    }

    startServer = () => {
        const port = process.env.PORT || 8000;
        this.expressServer.use(express.static(path.join(__dirname, '../client/build')));
        this.expressServer.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
        });
        this.expressServer.listen(port);
        this.game.startWebsocket();
    }
}