import * as express from 'express';
import * as http from 'http';
import * as helemet from 'helmet';
import * as cors from 'cors';

import { Request, Response, Express } from 'express';
import { Namespace, Server, Socket } from 'socket.io';
import { ioConfig } from './config';
import { InvalidAction } from './game/game';

const app: Express = express();
const server: http.Server = http.createServer(app);

const ioServer: Server = new Server(server, ioConfig);
const gameNS: Namespace = ioServer.of('game');

app.use(cors());
app.use(helemet());

app.get('/', (req: Request, res: Response) => res.send('Hello, there!'));

ioServer.on('connection', (client: Socket) => {
    console.log('Connected to io successfully!');
    client.on('hey', (message) => {
        console.log(message);
        client.emit('yo', { name: 'khalil' });
    });
});

gameNS.on('connection', (client: Socket) => {
    console.log('Connected to game namespace successfully!');
    client.on('hey', (message) => {
        client.emit('yo', message);
    });
});

server.listen(3000, () => console.log('server listening to *:3000'));

const inv = new InvalidAction();
