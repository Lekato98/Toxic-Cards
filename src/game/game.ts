import { Card, CardAbility, CardUtil } from './card';
import { CardStack } from './card-stack';
import { Deck } from './deck';
import { Player } from './player';
import { BurnedPicked } from './state/burned-picked';
import { Burn } from './state/burn';
import { EndOfRound } from './state/end-of-round';
import { ExchangeHandWithOther } from './state/exchange-hand-with-other';
import { PickBurn } from './state/pick-burn';
import { PilePicked } from './state/pile-picked';
import { BeginOfRound } from './state/begin-of-round';
import { ShowOneHandCard } from './state/show-one-hand-card';
import { ShowOneOtherHandCard } from './state/show-one-other-hand-card';
import { State, UserActionPayload } from './state/state';
import { BeginOfTurn } from './state/begin-of-turn';
import { EndOfTurn } from './state/end-of-turn';
import { EndOfGame } from './state/end-of-game';
import { Utils } from './utils';
import { Event, GameSocketService } from '../socket/socket';
import { BeginOfGame } from './state/begin-of-game';

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
    private static autoCounter: number = 0;
    public readonly id: number;
    public players: Array<Player>;
    public deck: Deck;
    public burnedCards: CardStack;
    public pileOfCards: CardStack;
    public passedBy: Player;
    public turn: number;
    public state: State;
    public maxNumberOfPlayers: number;
    public isGameStarted: boolean;
    public pickedCard: Card;
    public leader: number;
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
    private readonly MIN_NUMBER_OF_PLAYERS: number = 3;
    private readonly MAX_NUMBER_OF_PLAYERS: number = 8;
    public readonly DEFAULT_NUMBER_OF_CARDS_PER_HAND: number = 4;
    public readonly DEFAULT_MIN_NUMBER_OF_IN_PLAYERS: number = 2;
    public readonly DEFAULT_MINIMUM_PLAYER_TOTAL_SCORE: number = -100;
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

    constructor(maxNumberOfPlayers: number, state: State, creatorId: number = null) {
        if (!this.isValidMaxNumberOfPlayers(maxNumberOfPlayers)) {
            throw new Error('Invalid number of players');
        }

        this.id = Game.generateId();
        this.maxNumberOfPlayers = maxNumberOfPlayers;
        this.deck = new Deck();
        this.burnedCards = new CardStack();
        this.pileOfCards = new CardStack();
        this.userPlayer = new Map<number, Player>();
        this.userSpectator = new Map<number, boolean>();
        this.jointType = new Map<number, JoinType>();
        this.state = state;
        this.isGameStarted = false;
        this.pickedCard = null;
        this.passedBy = null;
        this.leader = creatorId;

        this.initializePlayers();
        if (!Utils.isNullOrUndefined(creatorId)) {
            this.joinAsPlayerAction(creatorId);
        }
    }

    public static generateId(): number {
        return ++Game.autoCounter;
    }

    public initializePlayers(): void {
        this.players = new Array<Player>(this.maxNumberOfPlayers);
        for (let id = 0; id < this.maxNumberOfPlayers; ++id) {
            this.players[id] = new Player(id);
        }
    }

    public get numberOfUserPlayers(): number {
        return this.userPlayer.size;
    }

    public get numberOfSpectators(): number {
        return this.userSpectator.size;
    }

    public setLeader(userId: number) {
        this.leader = userId;
    }

    public setState(state: State): void {
        this.state = state;
        GameSocketService.emitRoom(Event.UPDATE_STATE, this.id, this.getState());

        if (this.state instanceof BeginOfRound) {
            this.action(Action.BEGIN_OF_ROUND);
        } else if (this.state instanceof Burn) {
            this.action(Action.BURN_CARD);
        } else if (this.state instanceof EndOfRound) {
            this.action(Action.END_OF_ROUND);
        } else if (this.state instanceof BeginOfTurn) {
            this.action(Action.BEGIN_OF_TURN);
        } else if (this.state instanceof EndOfTurn) {
            this.action(Action.END_OF_TURN);
        } else if (this.state instanceof EndOfGame) {
            this.action(Action.END_OF_GAME);
        }
    }

    public validateUsingActionBased(action: Action, userId?: number): boolean {
        if (this.LEADER_BASED_ACTIONS.includes(action)) {
            return this.isLeaderUser(userId);
        } else if (this.USER_BASED_ACTION.includes(action)) {
            return !Utils.isNullOrUndefined(userId);
        } else if (this.USER_TURN_BASED_ACTION.includes(action)) {
            return this.isUserTurn(userId);
        } else {
            // @todo check if needed
            return Utils.isNullOrUndefined(userId) && this.INTERNAL_BASED_ACTION.includes(action);
        }
    }

    public action(action: Action, payload?: UserActionPayload) {
        if (!this.validateUsingActionBased(action, payload?.userId)) {
            throw new InvalidAction('Action is not allowed, invalid user type');
        }

        // global available actions
        switch (action) {
            case Action.JOIN_AS_PLAYER:
                return this.joinAsPlayerAction(payload.userId, payload.playerId);

            case Action.JOIN_AS_SPECTATOR:
                return this.joinAsSpectatorAction(payload.userId);

            case Action.LEAVE:
                return this.leaveAction(payload.userId);

            case Action.PASS:
                return this.passAction();

            default:
                this.state.action(this, action, payload);
        }
    }

    public nextTurn() {
        let loopSafer = 0; // to avoid infinite loop caused by unnoticed bug
        do {
            this.turn = (this.turn + 1) % this.players.length;
            if (loopSafer++ > this.players.length) {
                throw new Error('Infinite loop');
            }
        } while(this.players[this.turn].isOut);
    }

    public beginOfGameAction() {
        // @todo check if can start game, check num of players, or add bots etc ..
        if (this.isGameStarted) {
            throw new InvalidAction('Game already started');
        }

        this.isGameStarted = true;
        this.selectFirstTurnAction();
        this.setState(BeginOfRound.getInstance());
    }

    public beginOfRoundAction() {
        this.deck.shuffle();
        this.distributeCardsAction();
        this.showTwoHandCardsAction();
        this.nextTurn();
        this.setState(BeginOfTurn.getInstance());
    }

    public beginOfTurnAction(): void {
        if (this.passedBy === this.players[this.turn]) {
            return this.setState(EndOfRound.getInstance());
        }

        this.setState(PickBurn.getInstance());
    }

    // @todo maybe rename (remove action from name)
    public distributeCardsAction() {
        this.players.forEach((_player: Player) => {
            for (let i = 1; i <= this.DEFAULT_NUMBER_OF_CARDS_PER_HAND; ++i) {
                if (!_player.isOut) {
                    _player.addCardToHand(this.deck.pop());
                }
            }
        });

        while (!this.deck.isEmpty()) {
            this.pileOfCards.put(this.deck.pop());
        }
    }

    // @todo maybe rename (remove action from name)
    public showTwoHandCardsAction() {
        this.players.forEach((_player: Player) => !_player.isOut && _player.emitTwoCards());
    }

    // @todo maybe rename (remove action from name)
    public selectFirstTurnAction() {
        this.turn = Utils.randomIndex(this.players);
    }

    public pickCardFromPileAction() {
        const pickedCard = this.pileOfCards.pick();
        this.pickedCard = pickedCard;
        const userId = this.players[this.turn].getUserId();
        GameSocketService.emitUser(Event.STATUS, userId, {pickedCard: pickedCard.toShow(), isBurnedCard: false});
        this.setState(PilePicked.getInstance());
    }

    public pickCardFromBurnedAction() {
        if (this.burnedCards.isEmpty()) {
            throw new InvalidAction('Burned cards stack is empty');
        }

        const pickedCard = this.burnedCards.pick();
        this.pickedCard = pickedCard;
        const userId = this.players[this.turn].getUserId();
        GameSocketService.emitUser(Event.STATUS, userId, {pickedCard: pickedCard.toShow(), isBurnedCard: true});
        this.setState(BurnedPicked.getInstance());
    }

    public burnOneHandCardAction(userId: number, cardId: string) {
        if (this.burnedCards.isEmpty()) {
            throw new InvalidAction('Burned cards stack is empty');
        }

        const player = this.userPlayer.get(userId);
        if (!this.isValidPlayerCard(player.id, cardId)) {
            throw new InvalidAction('Invalid picked card');
        }

        const card = player.getCard(cardId);
        const topBurnedCard = this.burnedCards.top;
        if (card.equalsRank(topBurnedCard)) {
            player.handCards.remove(card);
            this.burnedCards.put(card);
        } else {
            player.handCards.add(this.burnedCards.pick());
        }

        this.setState(EndOfTurn.getInstance());
    }

    public useAbilityAction(): void {
        const cardAbility = this.pickedCard.getAbility();
        this.pickedCard.markAsUsed();
        switch (cardAbility) {
            case CardAbility.EXCHANGE_HAND_WITH_OTHER:
                return this.setState(ExchangeHandWithOther.getInstance());

            case CardAbility.SHOW_ONE_HAND_CARD:
                return this.setState(ShowOneHandCard.getInstance());

            case CardAbility.SHOW_ONE_OTHER_HAND_CARD:
                return this.setState(ShowOneOtherHandCard.getInstance());

            case CardAbility.NO_ABILITY:
                return this.setState(Burn.getInstance());

            default:
                throw new InvalidAction('Unknown ability');
        }
    }

    public exchangePickWithHandAction(userId: number, cardId: string) {
        const player = this.userPlayer.get(userId);
        if (!this.isValidPlayerCard(player.id, cardId)) {
            throw new InvalidAction('Pick a valid card');
        }

        const card = player.getCard(cardId);
        const pickedCard = this.pickedCard;
        CardUtil.swap(card, pickedCard);
        this.setState(Burn.getInstance());
    }

    public exchangeHandWithOther(userId: number, cardId: string, otherPlayerId: number, otherCardId: string) {
        if (this.isValidPlayer(otherPlayerId) && this.isValidPlayerCard(otherPlayerId, otherCardId)) {
            const player = this.userPlayer.get(userId);
            const otherPlayer = this.players[otherPlayerId];
            if (player === otherPlayer) {
                throw new InvalidAction('Changing card with your self is not allowed');
            } else if (!this.isValidPlayerCard(player.id, cardId)) {
                throw new InvalidAction('Pick a valid card');
            }

            const playerCard = player.getCard(cardId);
            const otherPlayerCard = otherPlayer.getCard(otherCardId);
            CardUtil.swap(playerCard, otherPlayerCard);
            this.setState(Burn.getInstance());
        } else {
            throw new InvalidAction('Pick a valid card.');
        }
    }

    public showOneHandCardAction(userId: number, cardId: string) {
        const player = this.userPlayer.get(userId);
        if (!this.isValidPlayerCard(player.id, cardId)) {
            throw new InvalidAction('Pick a valid card');
        }

        const card = player.getCard(cardId);
        GameSocketService.emitUser(Event.STATUS, userId, {card: card.toShow()});
        this.setState(Burn.getInstance());
    }

    public showOneOtherHandCardAction(userId: number, otherPlayerId: number, otherCardId: string) {
        if (this.isValidPlayer(otherPlayerId) && this.isValidPlayerCard(otherPlayerId, otherCardId)) {
            const card = this.players[otherPlayerId].getCard(otherCardId);
            GameSocketService.emitUser(Event.STATUS, userId, {card: card.toShow()});
            this.setState(Burn.getInstance());
        } else {
            throw new InvalidAction('Pick valid card');
        }
    }

    public burnAction() {
        this.burnedCards.put(this.pickedCard);
        this.pickedCard = null;
        this.setState(EndOfTurn.getInstance());
    }

    public passAction() {
        if (!Utils.isNullOrUndefined(this.passedBy)) {
            throw new InvalidAction('There is already player passed');
        }

        this.passedBy = this.players[this.turn];
    }

    public endOfTurnAction(): void {
        this.pickedCard = null; // @todo maybe remove it and put it in burn action

        this.nextTurn();
        this.setState(BeginOfTurn.getInstance());
    }

    public endOfRoundAction(): void {
        this.calculateScores(); // calculate first
        this.sanitizePlayers(); // then check which player is out

        // then reset
        this.players.forEach((_player: Player) => _player.clearHand());
        this.pileOfCards.clear();
        this.burnedCards.clear();
        this.deck.reset();
        this.passedBy = null;

        if (this.isEndOfGame()) {
            this.setState(EndOfGame.getInstance());
        } else {
            this.setState(BeginOfRound.getInstance());
        }
    }

    public endOfGameAction() {
        this.resetGame();
        this.setState(BeginOfGame.getInstance());
    }

    // user/turn action, game action, leader action
    public restartAction() {
        this.resetGame();
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

    public joinAsPlayerAction(userId: number, playerId?: number): void {
        if (this.isJoinedAsPlayer(userId)) {
            throw new InvalidAction('Player already joined');
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
            this.leaveAction(userId);
        }

        if (!this.numberOfUserPlayers) {
            this.setLeader(userId);
        }

        this.players[playerId].markAsUser(userId);
        this.userPlayer.set(userId, this.players[playerId]);
        this.jointType.set(userId, JoinType.PLAYER);
    }

    public joinAsSpectatorAction(userId: number): void {
        if (this.isJoined(userId)) {
            throw new InvalidAction(`User is already joined as ${ this.jointType.get(userId) }`);
        }

        this.userSpectator.set(userId, true);
        this.jointType.set(userId, JoinType.SPECTATOR);
    }

    public leaveAction(userId: number): void {
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

    private fixLeader(userId: number): void {
        if (userId === this.leader) {
            // @todo set new leader
        }
    }

    public sanitizePlayers(): void {
        this.players.forEach((player) => {
            const isLost = player.getTotalScore() <= this.DEFAULT_MINIMUM_PLAYER_TOTAL_SCORE;
            if (isLost) {
                player.markAsOut();
            }
        })
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
                } else if(player === this.passedBy) {
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
        return numberOfInPlayers < this.DEFAULT_MIN_NUMBER_OF_IN_PLAYERS || numberOfBots === this.maxNumberOfPlayers;
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

    public isValidMaxNumberOfPlayers(numberOfPlayers: number): boolean {
        return this.MIN_NUMBER_OF_PLAYERS <= numberOfPlayers && numberOfPlayers <= this.MAX_NUMBER_OF_PLAYERS;
    }

    public isLeaderUser(userId: number): boolean {
        return this.leader === userId;
    }

    public isValidPlayer(playerId: number): boolean {
        return 0 <= playerId && playerId < this.players.length && !this.players[playerId].isOut;
    }

    public isValidPositionToJoin(playerId: number): boolean {
        return this.isValidPlayer(playerId) && this.players[playerId].isBot;
    }

    public isValidPlayerCard(playerId: number, cardId: string): boolean {
        return this.isValidPlayer(playerId) && !Utils.isNullOrUndefined(this.players[playerId].handCards.getCard(cardId));
    }

    public isFull(): boolean {
        return this.numberOfUserPlayers === this.maxNumberOfPlayers;
    }

    public isEmpty(): boolean {
        return this.numberOfUserPlayers === 0;
    }

    public isJoined(userId: number): boolean {
        return this.jointType.has(userId);
    }
}
