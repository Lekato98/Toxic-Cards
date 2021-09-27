import * as express from 'express';
import { Express, Request, Response } from 'express';
import * as http from 'http';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { Server } from 'socket.io';
import { ioConfig } from './config';
import { GameSocketService } from './socket/socket';
import * as path from 'path';

const app: Express = express();
const server: http.Server = http.createServer(app);

const io: Server = new Server(server, ioConfig);
GameSocketService.init(io);

app.use(cors());
// app.use(helmet());
app.use(express.static(path.join(__dirname, '/public')));
app.set('views', path.join(__dirname, '/public/views'));
app.set('view engine', 'ejs');
app.get('/', (req: Request, res: Response) => res.render('index'));

server.listen(3000, () => console.log('server listening to *:3000'));
