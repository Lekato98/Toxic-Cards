import { Namespace, Server, Socket } from 'socket.io';
import { NextFunction } from 'express';
import { Utils } from '../game/utils';
import { Action, Game } from '../game/game';
import { BeginOfGame } from '../game/state/begin-of-game';
import * as chalk from 'chalk';
import { GameConfig } from '../game/game-config';

export enum Event {
    CONNECTION = 'connection',
    PING = 'ping',
    PONG = 'pong',
    STATUS = 'status',
    SUCCESS = 'success',
    CREATE_GAME = 'create_game',
    JOIN_GAME = 'join_game',
    JOIN_QUEUE = 'join_queue',
    ACTION = 'action',
    LEAVE_GAME = 'leave_game',
    UPDATE_STATE = 'update_state',
    RECONNECT = 'reconnect',
    ERROR = 'error',
    DISCONNECT = 'disconnect',
}

enum NamespacePrefix {
    GLOBAL = '/',
    GAME = '/game',
}

enum DisconnectReason {
    PING_TIMEOUT = 'ping timeout',
    TRANSPORT_CLOSE = 'transport close',
    TRANSPORT_ERROR = 'transport error',
    SERVER_DISCONNECT = 'io server disconnect',
    CLIENT_DISCONNECT = 'io client disconnect',
}

export abstract class GameSocketService {
    private static namespace: Namespace;
    private static userClients: Map<number, Socket>;
    private static userTimeout: Map<number, number>;
    private static games: Map<number, Game>;
    private static userGames: Map<number, Game>;

    public static init(server: Server): void {
        GameSocketService.namespace = server.of(NamespacePrefix.GAME);
        GameSocketService.userClients = new Map<number, Socket>();
        GameSocketService.games = new Map<number, Game>();
        GameSocketService.userGames = new Map<number, Game>();
        GameSocketService.initMiddlewares();
        GameSocketService.initEvents();
    }

    public static authMiddleware(client: Socket, next: NextFunction): void {
        const {
            auth: token,
            query,
            headers,
        } = client.handshake;
        console.log(`Authorizing token: `, token);
        console.log(`Authorizing query: `, query);
        console.log(`Authorizing headers: `, headers);
        const userId = ~~(token.userId ?? query.userId);
        // @todo use jwt later
        if (Utils.isNullOrUndefined(userId)) {
            return next(new Error('Unauthorized'));
        }

        client.data = {userId};
        console.log(`Authorized user: ${ userId }`);
        next();
    }

    public static onConnectionGame(client: Socket): void {
        console.log(`Client#${ client.id } joined Game Namespace!`);
        GameSocketService.reconnect(client);
        GameSocketService.preEvents(client);
        GameSocketService.addNewUserClient(client);
        GameSocketService.pingPongEvent(client);
        GameSocketService.createGameEvent(client);
        GameSocketService.joinGameEvent(client);
        GameSocketService.joinQueueEvent(client);
        GameSocketService.leaveGameEvent(client);
        GameSocketService.actionEvent(client);
    }

    public static onDisconnect(client: Socket): void {
        client.on(Event.DISCONNECT, (reason: DisconnectReason) => {
            console.log(`Client#${ client.id },User#${ client.data.userId } left Game Namespace, due to ${ reason }`);
            const {userId} = client.data;
            if (GameSocketService.isInGame(userId)) {
                const game = GameSocketService.userGames.get(userId);
                GameSocketService.unregisterClient(client, game);
                switch (reason) {
                    case DisconnectReason.SERVER_DISCONNECT:
                    case DisconnectReason.CLIENT_DISCONNECT:
                        // case DisconnectReason.TRANSPORT_CLOSE:
                        GameSocketService.userClients.delete(userId);
                }
            }
        });
    }

    public static pingPongEvent(client: Socket): void {
        client.on(Event.PING, () => client.emit(Event.PONG));
    }

    public static preEvents(client: Socket): void {
        client.prependAny((...args) => {
            const [event, ...payload] = args;
            const {userId} = client.data;
            if (event !== Event.PING) {
                console.log(
                    chalk.blue('~GAME_EVENT'),
                    'namespace:', NamespacePrefix.GAME,
                    ', userId:', userId,
                    ', event:', chalk.green(event.toUpperCase()),
                    ', payload:', payload,
                );
            }
        });
    }

    public static createGameEvent(client: Socket): void {
        client.on(Event.CREATE_GAME, (payload) => {
            try {
                const {userId} = client.data;
                if (GameSocketService.isInGame(userId)) {
                    return GameSocketService.handleError(client, new Error('User is already in game'));
                }

                const gameConfig = new GameConfig(payload);
                const game = new Game(gameConfig, BeginOfGame.getInstance(), userId);
                GameSocketService.games.set(game.id, game);
                GameSocketService.registerClient(client, game);
            } catch (e) {
                GameSocketService.handleError(client, e);
            }
        });
    }

    public static joinGameEvent(client: Socket): void {
        client.on(Event.JOIN_GAME, (payload) => {
            try {
                const {userId} = client.data;
                if (GameSocketService.isInGame(userId)) {
                    return GameSocketService.handleError(client, new Error('User is already in game'));
                }

                const {gameId, playerId} = payload;

                if (!GameSocketService.isGameAvailable(gameId)) {
                    return GameSocketService.handleError(client, new Error('Game not found.'));
                }

                const game = GameSocketService.games.get(gameId);
                game.doAction(Action.JOIN_AS_PLAYER, {userId, playerId});
                GameSocketService.registerClient(client, game);
            } catch (e) {
                GameSocketService.handleError(client, e);
            }
        });
    }

    public static joinQueueEvent(client: Socket): void {
        client.on(Event.JOIN_QUEUE, () => {
            try {
                const {userId} = client.data;
                let game: Game;
                GameSocketService.games.forEach((_game) => {
                    if (!_game.isFull()) {
                        return game = _game;
                    }
                });

                if (game) {
                    game.doAction(Action.JOIN_AS_PLAYER, {userId});
                    return GameSocketService.registerClient(client, game);
                }

                const message = GameSocketService.games.size ?
                    'All games are full create new game...' :
                    'Be the first one to create a new game!';
                GameSocketService.handleError(client, new Error(message));
            } catch (e) {
                GameSocketService.handleError(client, e);
            }
        });
    }

    public static actionEvent(client: Socket): void {
        client.on(Event.ACTION, (payload) => {
            try {
                const {userId} = client.data;
                if (!GameSocketService.isInGame(userId)) {
                    return GameSocketService.handleError(client, new Error(`User#${ userId } is not in game`));
                }

                const {action, ...actionPayload} = payload;
                const game = GameSocketService.userGames.get(userId);
                actionPayload.userId = userId;
                game.doAction(payload.action, actionPayload);
            } catch (e) {
                GameSocketService.handleError(client, e);
            }
        });
    }

    public static leaveGameEvent(client: Socket): void {
        client.on(Event.LEAVE_GAME, () => {
            try {
                const {userId} = client.data;
                if (!GameSocketService.isInGame(userId)) {
                    return GameSocketService.handleError(client, new Error('User is not in game'));
                }

                const game = GameSocketService.userGames.get(userId);
                GameSocketService.unregisterClient(client, game);
            } catch (e) {
                GameSocketService.handleError(client, e);
            }
        });
    }

    public static addNewUserClient(client: Socket): void {
        GameSocketService.userClients.set(client.data.userId, client);
    }

    public static reconnect(client: Socket): void {
        const {userId} = client.data;
        if (!GameSocketService.userClients.has(userId)) {
            return;
        }

        GameSocketService.userClients.set(userId, client);
        client.emit(Event.STATUS, {message: 'reconnected successfully'});
        if (GameSocketService.isInGame(userId)) {
            console.log(`User#${ userId } reconnecting to game`);
            const game = GameSocketService.userGames.get(userId);
            GameSocketService.registerClient(client, game);
            client.emit(Event.UPDATE_STATE, game.getState());
        }
    }

    public static emitRoom(event: Event, roomId: string | number, payload: any): void {
        console.log(`Event ${ event }, Room ${ roomId }, Payload`, payload);
        GameSocketService.namespace.to(String(roomId)).emit(event, payload);
    }

    public static emitUser(event: Event, userId: number, payload: any): void {
        if (GameSocketService.userClients.has(userId)) {
            console.log(`Event ${ event }, User ${ userId }, Payload`, payload);
            const client = GameSocketService.userClients.get(userId);
            client.emit(event, payload);
        }
    }

    private static initEvents(): void {
        GameSocketService.namespace.on(Event.CONNECTION, GameSocketService.onConnectionGame);
        GameSocketService.namespace.on(Event.CONNECTION, GameSocketService.onDisconnect);
    }

    private static initMiddlewares(): void {
        GameSocketService.namespace.use(GameSocketService.authMiddleware);
    }

    private static isInGame(userId: number): boolean {
        return GameSocketService.userGames.has(userId);
    }

    private static isGameAvailable(gameId: number | string): boolean {
        return GameSocketService.games.has(~~gameId);
    }

    private static registerClient(client: Socket, game: Game): void {
        const {userId} = client.data;
        const gameId = String(game.id);
        client.join(gameId); // join client to room of game
        GameSocketService.userGames.set(userId, game); // assign userId to map game
        GameSocketService.emitRoom(Event.UPDATE_STATE, gameId, game.getState()); // update state
        GameSocketService.emitRoom(Event.SUCCESS, gameId, {message: `${ userId } just joined the game!`}); // broadcast message to room members
    }

    private static unregisterClient(client: Socket, game: Game): void {
        const {userId} = client.data;
        const gameId = String(game.id);
        client.leave(gameId);
        game.doAction(Action.LEAVE, {userId});
        GameSocketService.userGames.delete(userId);
        GameSocketService.emitRoom(Event.UPDATE_STATE, gameId, game.getState()); // update state
        GameSocketService.emitRoom(Event.SUCCESS, gameId, {message: `${ userId } just left the game!`}); // broadcast message to room members
        GameSocketService.deleteEmptyGame(game);
    }

    private static handleError(client: Socket, err: Error): void {
        console.error(err);
        client.emit(Event.ERROR, err.message);
    }

    private static deleteEmptyGame(game: Game): void {
        if (game.isEmpty()) {
            game.clearTimeout();
            GameSocketService.games.delete(game.id);
            console.log(`Game#${ game.id } has be deleted successfully`);
        }
    }

    private static setUserTimeout(userId: number, timeMs): void {
        GameSocketService.userTimeout.set(
            userId,
            // @ts-ignore
            setTimeout(() => {

            }, timeMs),
        );
    }

    private static clearUserTimeout(userId: number): void {
        clearTimeout(GameSocketService.userTimeout.get(userId));
    }
}
