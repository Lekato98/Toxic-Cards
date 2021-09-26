import * as express from 'express';
import { Express, Request, Response } from 'express';
import * as http from 'http';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { Namespace, Server, Socket } from 'socket.io';
import { ioConfig } from './config';
import { Action, Game } from './game/game';
import { BeginOfGame } from './game/state/begin-of-game';

const app: Express = express();
const server: http.Server = http.createServer(app);

const ioServer: Server = new Server(server, ioConfig);
const globalNS: Namespace = ioServer.of('/');
const gameNS: Namespace = ioServer.of('game');

app.use(cors());
app.use(helmet());

app.get('/', (req: Request, res: Response) => res.send('Hello, there!'));

globalNS.on('connection', (client: Socket) => {
    console.log(`new connection Client #${client.id}`);
    client.on('check_connection', (message) => {
        client.emit('status', {status: 'connected!', receivedMessage: message});
    });
});

const games: Array<Game> = new Array<Game>();
const inGame: Map<number, number> = new Map<number, number>();

gameNS.on('connection', (client: Socket) => {
    console.log('Connected to game namespace successfully!');
    client.on('create_game', (message) => {
        try {
            if (inGame.has(message.userId)) {
                throw new Error('Player is already in game');
            }
            games.push(new Game(message.numberOfPlayers, BeginOfGame.getInstance()));
            client.emit('game_created', {
                message: 'game created successfully',
                gameId: games.length - 1,
            });
        } catch (e) {
            console.error(e);
            client.emit('error', e.message);
        }
    });

    client.on('join_game', (message) => {
        try {
            if (inGame.has(message.userId)) {
                throw new Error('Player is already in game');
            }

            games[Number(message.gameId)].action(Action.JOIN_AS_PLAYER, message);
            inGame.set(message.userId, message.gameId);
            client.emit('joined', {
                message: 'Joined!',
            });
        } catch (e) {
            console.error(e);
            client.emit('error', e.message);
        }
    });

    client.on('game_action', (message) => {
        try {
            if (!inGame.has(message.userId)) {
                throw new Error('Player is not joined any game');
            }

            games[Number(inGame.get(message.userId))].action(message.action, message);
        } catch (e) {
            console.error(e);
            client.emit('error', e.message);
        }
    });
});

server.listen(3000, () => console.log('server listening to *:3000'));
