import { Card } from './card';
import { CardStack } from './card-stack';
import { Deck } from './deck';
import { Player } from './player';
import { Burn } from './state/burn';
import { EndOfRound } from './state/end-of-round';
import { BeginOfRound } from './state/begin-of-round';
import { State, UserActionPayload } from './state/state';
import { BeginOfTurn } from './state/begin-of-turn';
import { EndOfTurn } from './state/end-of-turn';
import { EndOfGame } from './state/end-of-game';
import { Utils } from './utils';
import { Event, GameSocketService } from '../socket/socket';
import { BeginOfGame } from './state/begin-of-game';
import { GameAction } from './game-action';
import { GameConfig } from './game-config';

export class InvalidAction extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidAction';
        this.message = message ?? 'Action is not allowed in current state';
    }
}

export enum Action {
    // CREATE_GAME,
    START_GAME,
    BEGIN_OF_ROUND,
    BEGIN_OF_TURN,
    JOIN_AS_PLAYER,
    JOIN_AS_SPECTATOR,
    DISTRIBUTE_CARD,
    SELECT_FIRST_TURN,
    PICK_CARD_FROM_PILE,
    PICK_CARD_FROM_BURNED,
    BURN_ONE_HAND_CARD,
    BURN_CARD,
    THROW_CARD,
    USE_ABILITY,
    EXCHANGE_PICK_WITH_HAND,
    EXCHANGE_HAND_WITH_OTHER,
    SHOW_ONE_HAND_CARD,
    SHOW_ONE_OTHER_HAND_CARD,
    NEXT_TURN,
    PASS,
    END_OF_TURN,
    END_OF_ROUND,
    END_OF_GAME,
    RESTART,
    LEAVE,
    // NO_ACTION,
}

export enum JoinType {
    PLAYER = 'player',
    SPECTATOR = 'spectator',
}

// @todo add resetRound&resetTurn&resetGame and maybe bot them in onBegin not onEnd
export class Game {
    private static autoIncrementCounter: number = 0;
    public readonly id: number;
    public readonly players: Array<Player>;
    public readonly deck: Deck;
    public readonly burnedCards: CardStack;
    public readonly pileOfCards: CardStack;
    public readonly action: GameAction;
    public state: State;
    public passedBy: Player;
    public pickedCard: Card;
    public turn: number;
    public readonly numberOfPlayers: number;
    public isGameStarted: boolean;
    public leader: number;
    public readonly DEFAULT_NUMBER_OF_CARDS_PER_HAND: number = 4;
    public readonly DEFAULT_MIN_NUMBER_OF_IN_PLAYERS: number = 2;
    public readonly DEFAULT_MINIMUM_PLAYER_TOTAL_SCORE: number = -100;
    // all actions that's will be called directly from game
    public readonly INTERNAL_BASED_ACTION = [
        Action.START_GAME,
        Action.BEGIN_OF_ROUND,
        Action.BEGIN_OF_TURN,
        Action.DISTRIBUTE_CARD,
        Action.SELECT_FIRST_TURN,
        Action.BURN_CARD,
        Action.END_OF_TURN,
        Action.END_OF_ROUND,
        Action.END_OF_GAME,
        Action.NEXT_TURN,
    ];
    // all actions that's need to check isValidUser (real user)
    public readonly USER_BASED_ACTION = [
        Action.JOIN_AS_PLAYER,
        Action.JOIN_AS_SPECTATOR,
        Action.LEAVE,
    ];
    private readonly userPlayer: Map<number, Player>;
    private readonly userSpectator: Map<number, boolean>;
    private readonly jointType: Map<number, JoinType>;
    // all actions that's need to check isLeader
    private readonly LEADER_BASED_ACTIONS = [Action.START_GAME, Action.RESTART];
    // all actions that's need to check isUserTurn (is a valid user turn)
    private readonly USER_TURN_BASED_ACTION = [
        Action.EXCHANGE_PICK_WITH_HAND,
        Action.EXCHANGE_HAND_WITH_OTHER,
        Action.SHOW_ONE_OTHER_HAND_CARD,
        Action.SHOW_ONE_HAND_CARD,
        Action.PASS,
        Action.USE_ABILITY,
        Action.THROW_CARD,
        Action.PICK_CARD_FROM_BURNED,
        Action.PICK_CARD_FROM_PILE,
        Action.BURN_ONE_HAND_CARD,
    ];

    constructor(gameConfigs: GameConfig, state: State, creatorId?: number) {
        const {
            numberOfPlayers,
            deckSize,
        } = gameConfigs;

        this.id = Game.generateId();
        this.numberOfPlayers = numberOfPlayers;
        this.deck = new Deck(deckSize);
        this.burnedCards = new CardStack();
        this.pileOfCards = new CardStack();
        this.userPlayer = new Map<number, Player>();
        this.userSpectator = new Map<number, boolean>();
        this.jointType = new Map<number, JoinType>();
        this.players = new Array<Player>(this.numberOfPlayers);
        this.state = state;
        this.action = new GameAction(this);
        this.isGameStarted = false;
        this.pickedCard = null;
        this.passedBy = null;
        this.leader = creatorId ?? null;

        this.initializePlayers();
        if (!Utils.isNullOrUndefined(creatorId)) {
            this.joinAsPlayer(creatorId);
        }
    }

    public get numberOfUserPlayers(): number {
        return this.userPlayer.size;
    }

    public get numberOfSpectators(): number {
        return this.userSpectator.size;
    }

    public static generateId(): number {
        return ++Game.autoIncrementCounter;
    }

    public initializePlayers(): void {
        for (let id = 0; id < this.numberOfPlayers; ++id) {
            this.players[id] = new Player(id);
        }
    }

    public setLeader(userId: number) {
        this.leader = userId;
    }

    public setState(state: State): void {
        this.state = state;
        GameSocketService.emitRoom(Event.UPDATE_STATE, this.id, this.getState());

        if (this.state instanceof BeginOfRound) {
            this.doAction(Action.BEGIN_OF_ROUND);
        } else if (this.state instanceof Burn) {
            this.doAction(Action.BURN_CARD);
        } else if (this.state instanceof EndOfRound) {
            this.doAction(Action.END_OF_ROUND);
        } else if (this.state instanceof BeginOfTurn) {
            this.doAction(Action.BEGIN_OF_TURN);
        } else if (this.state instanceof EndOfTurn) {
            this.doAction(Action.END_OF_TURN);
        } else if (this.state instanceof EndOfGame) {
            this.doAction(Action.END_OF_GAME);
        }
    }

    public validateUsingActionBased(action: Action, userId?: number): boolean {
        if (this.LEADER_BASED_ACTIONS.includes(action)) {
            return this.isLeader(userId);
        } else if (this.USER_BASED_ACTION.includes(action)) {
            return !Utils.isNullOrUndefined(userId);
        } else if (this.USER_TURN_BASED_ACTION.includes(action)) {
            return this.isUserTurn(userId);
        } else {
            // @todo check if needed
            return Utils.isNullOrUndefined(userId) && this.INTERNAL_BASED_ACTION.includes(action);
        }
    }

    public doAction(action: Action, payload?: UserActionPayload) {
        if (!this.validateUsingActionBased(action, payload?.userId)) {
            throw new InvalidAction('Action is not allowed, invalid user type');
        }

        // global available actions
        switch (action) {
            case Action.JOIN_AS_PLAYER:
                return this.joinAsPlayer(payload.userId, payload.playerId);

            case Action.JOIN_AS_SPECTATOR:
                return this.joinAsSpectator(payload.userId);

            case Action.LEAVE:
                return this.leave(payload.userId);

            case Action.PASS:
                return this.action.passAction();

            default:
                this.state.action(this.action, action, payload);
        }
    }

    public nextTurn() {
        let loopSafer = 0; // to avoid infinite loop caused by unnoticed bug
        do {
            this.turn = (this.turn + 1) % this.players.length;
            if (loopSafer++ > this.players.length) {
                throw new Error('Infinite loop');
            }
        } while (this.players[this.turn].isOut);
    }

    public resetGame() {
        this.burnedCards.clear();
        this.pileOfCards.clear();
        this.deck.reset();
        this.isGameStarted = false;
        this.pickedCard = null;
        this.passedBy = null;
        this.turn = null;
        this.players.forEach((player) => player.reset());
        this.setState(BeginOfGame.getInstance());
    }

    public joinAsPlayer(userId: number, playerId?: number): void {
        if (this.isJoinedAsPlayer(userId)) {
            throw new InvalidAction('Player is already joined');
        }

        if (Utils.isNullOrUndefined(playerId)) {
            playerId = this.players.find((_player) => _player.isBot)?.id;
        }

        if (!this.isValidPositionToJoin(playerId)) {
            throw new InvalidAction('Invalid position or already taken');
        }

        if (this.isFull()) {
            throw new InvalidAction('The game is full, join another game');
        }

        if (this.isJoinedAsSpectator(userId)) {
            this.leave(userId);
        }

        if (!this.numberOfUserPlayers) {
            this.setLeader(userId);
        }

        this.players[playerId].markAsUser(userId);
        this.userPlayer.set(userId, this.players[playerId]);
        this.jointType.set(userId, JoinType.PLAYER);
    }

    public joinAsSpectator(userId: number): void {
        if (this.isJoined(userId)) {
            throw new InvalidAction(`User is already joined as ${ this.jointType.get(userId) }`);
        }

        this.userSpectator.set(userId, true);
        this.jointType.set(userId, JoinType.SPECTATOR);
    }

    public leave(userId: number): void {
        const jointType = this.jointType.get(userId);

        switch (jointType) {
            case JoinType.PLAYER:
                const player = this.userPlayer.get(userId);
                player.markAsBot();
                this.userPlayer.delete(userId);
                break;

            case JoinType.SPECTATOR:
                this.userSpectator.delete(userId);
                break;

            default:
                throw new InvalidAction('Unknown user');
        }

        this.jointType.delete(userId);
        this.fixLeader(userId);
        if (this.isEndOfGame()) {
            this.setState(BeginOfGame.getInstance());
        }
    }

    public sanitizePlayers(): void {
        this.players.forEach((player) => {
            const isLost = player.getTotalScore() <= this.DEFAULT_MINIMUM_PLAYER_TOTAL_SCORE;
            if (isLost) {
                player.markAsOut();
            }
        });
    }

    public calculateScores(): void {
        const scores = this.players.map((player) => player.getCurrentScore());
        const minScore = Math.min(...scores);
        if (this.passedBy.getCurrentScore() === minScore) { // win turn
            this.players.forEach((player) => {
                const isTurnWinner = player.getCurrentScore() === minScore; // if he got the minScore so add positive score else negative
                player.updateTotalScore(isTurnWinner);
            });
        } else { // lose turn
            this.players.forEach((player) => {
                const isTurnWinner = player.getCurrentScore() === minScore;
                if (isTurnWinner) {
                    player.updateTotalScore(); // default add positive score for the guy who beat the passed player
                } else if (player === this.passedBy) {
                    // the guy who passed and get beat by others will gain negative score
                    // when player pass and lose hi score will double two times in negative
                    player.updateTotalScore(false, 2);
                } else {
                    player.resetCurrentScore();
                }
            });
        }
    }

    public getPlayerByUserId(userId: number): Player {
        return this.userPlayer.get(userId);
    }

    public getState(): any {
        return {
            id: this.id,
            leader: this.leader,
            players: this.players.map((_player) => _player.getState()),
            numberOfPlayers: this.numberOfUserPlayers,
            numberOfSpectators: this.numberOfSpectators,
            state: this.state.constructor.name,
            turn: this.turn,
            topBurnedCards: this.burnedCards.top?.toShow() ?? {},
            passedBy: this.passedBy?.id,
            isGameStarted: this.isGameStarted,
        };
    }

    public isEndOfGame(): boolean {
        const numberOfInPlayers = this.players.reduce((reducer, player) => reducer + +!player.isOut, 0);
        const numberOfBots = this.players.reduce((reducer, player) => reducer + +player.isBot, 0);
        return numberOfInPlayers < this.DEFAULT_MIN_NUMBER_OF_IN_PLAYERS || numberOfBots === this.numberOfPlayers;
    }

    public isJoinedAsPlayer(userId: number): boolean {
        return this.userPlayer.has(userId);
    }

    public isJoinedAsSpectator(userId: number): boolean {
        return this.userSpectator.has(userId);
    }

    public isUserTurn(userId: number): boolean {
        return this.turn === this.userPlayer.get(userId).id;
    }

    public isLeader(userId: number): boolean {
        return this.leader === userId;
    }

    public isValidPlayer(playerId: number): boolean {
        return 0 <= playerId && playerId < this.players.length && !this.players[playerId].isOut;
    }

    public isValidPositionToJoin(playerId: number): boolean {
        return this.isValidPlayer(playerId) && this.players[playerId].isBot;
    }

    public isValidPlayerCard(playerId: number, cardId: string): boolean {
        return this.isValidPlayer(playerId) && this.players[playerId].hasCard(cardId);
    }

    public isFull(): boolean {
        return this.numberOfUserPlayers === this.numberOfPlayers;
    }

    public isEmpty(): boolean {
        return this.numberOfUserPlayers === 0;
    }

    public isJoined(userId: number): boolean {
        return this.jointType.has(userId);
    }

    private fixLeader(userId: number): void {
        if (userId === this.leader) {
            // @todo set new leader
        }
    }
}
