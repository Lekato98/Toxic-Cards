import * as express from 'express';
import { Express, Request, Response } from 'express';
import * as http from 'http';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { Namespace, Server, Socket } from 'socket.io';
import { ioConfig } from './config';
import { Action, Game } from './game/game';
import { BeginOfGame } from './game/state/begin-of-game';
import { GameSocketService } from './socket/socket';

const app: Express = express();
const server: http.Server = http.createServer(app);

const io: Server = new Server(server, ioConfig);
GameSocketService.init(io);

app.use(cors());
app.use(helmet());

app.get('/', (req: Request, res: Response) => res.send('Hello, there!'));

server.listen(3000, () => console.log('server listening to *:3000'));
