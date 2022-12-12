import { Server } from './server';

console.log('Starting server...');
const server = new Server();
console.log(`Server started: ${JSON.stringify(server.server.address())}, awaiting connections`);