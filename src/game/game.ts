import { Card, CardAbility, CardUtil } from './card';
import { CardHand } from './card-hand';
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
import { BeginOfGame } from './state/begin-of-game';
import { EndOfTurn } from './state/end-of-turn';
import { EndOfGame } from './state/end-of-game';

export class InvalidAction extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidAction';
        this.message = message ?? 'Action is not allowed in current state';
    }
}

export enum Action {
    CREATE_GAME, // user id
    START_GAME, // user id
    BEGIN_OF_ROUND,// internal
    BEGIN_OF_TURN, // internal
    JOIN_AS_PLAYER, // user id
    JOIN_AS_SPECTATOR, // user id
    DISTRIBUTE_CARD, // inner action
    SELECT_FIRST_TURN, // inner action
    PICK_CARD_FROM_PILE, // user id
    PICK_CARD_FROM_BURNED, // user id
    BURN_ONE_HAND_CARD,
    BURN_CARD, // user id, card id
    THROW_CARD, // user id, card id
    USE_ABILITY,
    EXCHANGE_PICK_WITH_HAND, // user id, card id
    EXCHANGE_HAND_WITH_OTHER, // user id, card id, other user id, other card id
    SHOW_ONE_HAND_CARD, // user id, card id
    SHOW_ONE_OTHER_HAND_CARD, // user id, other user id, other card id
    NEXT_TURN, // inner action
    PASS, // user id
    END_OF_TURN,
    END_OF_ROUND,
    END_OF_GAME,
    RESTART, // user id
    LEAVE, // user id
    NO_ACTION, // nothing
}

export enum JoinType {
    PLAYER,
    SPECTATOR,
}

export class Game {
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
    // all actions that's will be called directly from code
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
    // all actions that's need to check isValidUser
    public readonly USER_BASED_ACTION = [
        Action.JOIN_AS_PLAYER,
        Action.JOIN_AS_SPECTATOR,
        Action.LEAVE,
    ];
    private readonly userPlayer: Map<number, Player>;
    private userSpectator: Map<number, Player>;
    private readonly jointType: Map<number, JoinType>;
    private readonly MIN_NUMBER_OF_PLAYERS: number = 3;
    private readonly MAX_NUMBER_OF_PLAYERS: number = 8;
    public readonly DEFAULT_NUMBER_OF_CARDS_PER_HAND: number = 4;
    // all actions that's need to check isLeader
    private readonly LEADER_BASED_ACTIONS = [Action.START_GAME, Action.RESTART];
    // all actions that's need to check isUserTurn
    private readonly USER_TURN_BASED_ACTION = [
        Action.EXCHANGE_PICK_WITH_HAND,
        Action.PASS,
        Action.USE_ABILITY,
        Action.THROW_CARD,
        Action.PICK_CARD_FROM_BURNED,
        Action.PICK_CARD_FROM_PILE,
        Action.BURN_ONE_HAND_CARD,
    ];

    constructor(maxNumberOfPlayers: number, state: State) {
        if (!this.isValidMaxNumberOfPlayers(maxNumberOfPlayers)) {
            throw new Error('Invalid maximum number of players');
        }

        this.maxNumberOfPlayers = maxNumberOfPlayers;
        this.deck = new Deck();
        this.burnedCards = new CardStack();
        this.pileOfCards = new CardStack();
        this.userPlayer = new Map<number, Player>();
        this.jointType = new Map<number, JoinType>();
        this.state = state;
        this.isGameStarted = false;
        this.pickedCard = null;
        this.leader = null;
        this.passedBy = null;

        this.initializePlayers();
    }

    public initializePlayers(): void {
        this.players = new Array<Player>(this.maxNumberOfPlayers);
        for (let i = 0; i < this.maxNumberOfPlayers; ++i) {
            this.players[i] = new Player();
        }
    }

    public get numberOfPlayers(): number {
        return this.userPlayer.size;
    }

    public setLeader(userId: number) {
        this.leader = userId;
    }

    public setState(state: State): void {
        this.state = state;

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
        } else if (this.state instanceof  EndOfGame) {
            this.action(Action.END_OF_GAME);
        }
    }

    public validateUsingActionBased(action: Action, userId?: number): boolean {
        if (this.LEADER_BASED_ACTIONS.includes(action)) {
            return this.isLeaderUser(userId);
        } else if (this.USER_BASED_ACTION.includes(action)) {
            return userId !== null && userId !== undefined;
        } else if (this.USER_TURN_BASED_ACTION.includes(action)) {
            return this.isUserTurn(userId);
        } else {
            // todo check if needed
            return (userId === null || userId === undefined) && this.INTERNAL_BASED_ACTION.includes(action);
        }
    }

    public action(action: Action, payload?: UserActionPayload) {
        if (!this.validateUsingActionBased(action, payload?.userId)) {
            throw new InvalidAction;
        }

        // global available actions
        switch (action) {
            case Action.JOIN_AS_PLAYER: // same state
                return this.joinAsPlayerAction(payload.userId, payload.playerId);
            case Action.JOIN_AS_SPECTATOR: // same state
            case Action.LEAVE:
            case Action.PASS:
                return this.passAction();
            // this.doSomething();

            default:
                this.state.action(this, action, payload);
        }
    }

    public nextTurn() {
        this.turn = (this.turn + 1) % this.players.length;
    }

    public beginOfGameAction() {
        // @todo check if can start game, check num of players, or add bots etc ..
        if (this.isGameStarted) {
            throw new InvalidAction('Game already started');
        }

        this.isGameStarted = true;
        this.selectFirstTurnAction();
        this.setState(new BeginOfRound);
    }

    public beginOfRoundAction() {
        this.deck.shuffle();
        this.distributeCardsAction();
        this.showTwoHandCardsAction();
        this.setState(new BeginOfTurn);
    }

    public beginOfTurnAction(): void {
        if (this.passedBy === this.userPlayer.get(this.turn)) {
            return this.setState(new EndOfRound);
        }

        this.setState(new PickBurn);
    }

    // @todo maybe rename (remove action from name)
    public distributeCardsAction() {
        this.players.forEach((_player: Player) => {
            for (let i = 1; i <= this.DEFAULT_NUMBER_OF_CARDS_PER_HAND; ++i) {
                _player.addCardToHand(this.deck.pop());
            }
        });

        while (!this.deck.isEmpty()) {
            this.pileOfCards.put(this.deck.pop());
        }
    }

    // @todo maybe rename (remove action from name)
    public showTwoHandCardsAction() {
        this.players.forEach((_player: Player) => _player.emitTwoCards());
    }

    // @todo maybe rename (remove action from name)
    public selectFirstTurnAction() {
        // @todo move logic to helper class
        this.turn = Math.floor(Math.random() * this.players.length);
    }

    public pickCardFromPileAction() {
        this.pickedCard = this.pileOfCards.pick();
        this.setState(new PilePicked);
    }

    public pickCardFromBurnedAction() {
        if (this.burnedCards.isEmpty()) {
            throw new InvalidAction('Burned cards stack is empty');
        }

        this.pickedCard = this.burnedCards.pick();
        this.setState(new BurnedPicked);
    }

    public burnOneHandCardAction(userId: number, cardId: string) {
        if (this.burnedCards.isEmpty()) {
            throw new InvalidAction('Burned cards stack is empty');
        }

        const player = this.userPlayer.get(userId);
        const card = player.getCard(cardId);
        const topBurnedCard = this.burnedCards.top;
        if (card.equalsRank(topBurnedCard)) {
            player.handCards.remove(card);
            this.burnedCards.put(card);
        } else {
            player.handCards.add(this.burnedCards.pick());
        }

        this.setState(new EndOfTurn);
    }

    public useAbilityAction(): void {
        const cardAbility = this.pickedCard.getAbility();
        this.pickedCard.markAsUsed();
        switch (cardAbility) {
            case CardAbility.EXCHANGE_HAND_WITH_OTHER:
                return this.setState(new ExchangeHandWithOther);

            case CardAbility.SHOW_ONE_HAND_CARD:
                return this.setState(new ShowOneHandCard);

            case CardAbility.SHOW_ONE_OTHER_HAND_CARD:
                return this.setState(new ShowOneOtherHandCard);

            case CardAbility.NO_ABILITY:
                return this.setState(new Burn);

            default:
                throw new InvalidAction('Unknown ability');
        }
    }

    public exchangePickWithHandAction(userId: number, cardId: string) {
        const player = this.userPlayer.get(userId);
        const card = player.getCard(cardId);
        const pickedCard = this.pickedCard;
        CardUtil.swap(card, pickedCard);
        this.setState(new Burn);
    }

    public exchangeHandWithOther(userId: number, cardId: string, otherPlayerId: number, otherCardId: string) {
        if (this.isValidPlayer(otherPlayerId)) {
            const player = this.userPlayer.get(userId);
            const otherPlayer = this.players[otherPlayerId];
            if (player === otherPlayer) {
                throw new InvalidAction('Changing card with your self is not allowed');
            }

            const playerCard = player.getCard(cardId);
            const otherPlayerCard = otherPlayer.getCard(otherCardId);
            CardUtil.swap(playerCard, otherPlayerCard);
            this.setState(new Burn);
        } else {
            throw new InvalidAction('Pick a valid card.');
        }
    }

    public showOneHandCardAction(userId: number, cardId: string) {
        const card = this.userPlayer.get(userId).getCard(cardId);
        // emit with card suit, rank
        this.setState(new Burn);

        // remove it just for test
        return card;
    }

    public showOneOtherHandCardAction(userId: number, otherPlayerId: number, otherCardId: string) {
        if (this.isValidPlayer(otherPlayerId)) {
            const card = this.players[otherPlayerId].getCard(otherCardId);
            // emit with card suit, rank
            this.setState(new Burn);
        } else {
            throw new InvalidAction('Pick valid card');
        }
    }

    public burnAction() {
        this.burnedCards.put(this.pickedCard);
        this.pickedCard = null;
        this.setState(new EndOfTurn);
    }

    public passAction() {
        this.passedBy = this.userPlayer.get(this.turn);
    }

    public endOfTurnAction(): void {
        this.pickedCard = null; // @todo maybe remove it and put it in burn action

        this.nextTurn();
        this.setState(new BeginOfTurn);
    }

    public endOfRoundAction(): void {
        this.players.forEach((_player: Player) => _player.clearHand());
        this.pileOfCards.clear();
        this.burnedCards.clear();
        this.deck.reset();
        this.passedBy = null;
        // @todo score calculation
        // this.setState(new BeginOfRound);
        // just for testing
        this.setState(new EndOfGame);
    }

    public endOfGameAction() {
        // this.setState(new BeginOfGame);
    }

    // user/turn action, game action, leader action
    public restartAction() {
        // @todo function reset
    }

    public joinAsPlayerAction(userId: number, playerId: number): void {
        if (this.isJoinedAsPlayer(userId)) {
            throw new InvalidAction('Player already joined');
        }

        if (!this.isValidPlayer(playerId)) { // @todo check if the player is already taken
            throw new InvalidAction('Invalid position or already taken');
        }

        if (this.isFull()) {
            throw new InvalidAction('The game is full, join another game');
        }

        if (!this.numberOfPlayers) {
            this.setLeader(userId);
        }

        this.userPlayer.set(userId, this.players[playerId]);
    }

    public joinAsSpectatorAction(): void {

    }

    public leaveAction(): void {

    }

    public getPlayerByUserId(userId: number): Player {
        return this.userPlayer.get(userId);
    }

    public isJoinedAsPlayer(userId: number): boolean {
        return this.userPlayer.has(userId);
    }

    public isUserTurn(userId: number): boolean {
        return this.turn === userId;
    }

    public isValidMaxNumberOfPlayers(numberOfPlayers: number): boolean {
        return this.MIN_NUMBER_OF_PLAYERS <= numberOfPlayers && numberOfPlayers <= this.MAX_NUMBER_OF_PLAYERS;
    }

    public isLeaderUser(userId: number): boolean {
        return this.leader === userId;
    }

    public isValidPlayer(playerId: number): boolean {
        return 0 <= playerId && playerId < this.players.length;
    }

    public isFull(): boolean {
        return this.numberOfPlayers === this.maxNumberOfPlayers;
    }
}
