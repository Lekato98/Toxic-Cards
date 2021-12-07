import * as express from 'express';
import { Express, Request, Response } from 'express';
import * as http from 'http';
import * as cors from 'cors';
import { Server } from 'socket.io';
import { config, ioConfig } from './config';
import { GameSocketService } from './socket/socket';
import * as path from 'path';
// import * as helmet from 'helmet';

const app: Express = express();

app.use(cors());
// @todo give access for socket.io cdn
// app.use(helmet());
app.use(express.static(path.join(__dirname, '/public')));
app.set('views', path.join(__dirname, '/public/views'));
app.set('view engine', 'ejs');
app.get('/', (req: Request, res: Response) => {
    res.render('index', {
        DYNAMIC_ENDPOINT:
            config.NODE_ENV === 'production' ?
                // 'http://toxic-cards.fun' :
                'http://18.185.111.226' :
                `http://localhost:${ config.PORT }`,
    });
});

void function bootstrap(app: Express): void {
    const server: http.Server = http.createServer(app);
    const io: Server = new Server(server, ioConfig);
    GameSocketService.init(io);
    server.listen(config.PORT, () => console.log(`server listening to *:${ config.PORT }`));

    if (config.NODE_ENV === 'production') {
        console.log = (...args) => {};
        console.error = (...args) => {};
    }
}(app);
