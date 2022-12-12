import express from 'express';
import http from 'http';
import path from 'path';
import { Game } from './game';

export class Server {
    game: Game;
    server: http.Server;

    constructor() {
        this.server = this.startServer();
        this.game = new Game(this.server);
    }

    protected startServer = (): http.Server => {
        const port = process.env.PORT || 5000;
        const app = express();
        app.use(express.static(path.join(__dirname, '../client/build')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
        });
        return app.listen(port);
    }
}