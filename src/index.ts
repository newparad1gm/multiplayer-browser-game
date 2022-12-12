import { Server } from './server';

console.log('Starting server...');
const server = new Server();
server.startServer();
console.log('Server started, awaiting connections');