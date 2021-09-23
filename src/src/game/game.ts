import { Card } from "./card";
import { CardHand } from "./card-hand";
import { CardStack } from "./card-stack";
import { Deck } from "./deck";
import { Player } from "./player";
import { Prepare } from "./state/prepare";
import { State } from "./state/state";
import { User } from "./user";

export class InvalidAction extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidAction';
        this.message = message ?? 'Action is not allowed in current state';
    }
}

export interface UserAction {
    userId: number;
}

export enum Action {
    CREATE_GAME, // user id
    START_GAME, // user id
    JOIN_AS_PLAYER, // user id
    JOIN_AS_SPECTATOR, // user id
    DISTRBUTE_CARD, // inner action
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
    RESTART, // user id
    LEAVE, // user id
    NO_ACTION, // nothing
}

export enum StateName {
    PERPARE_GAME,
    START_GAME,
    IN_GAME,
}

export interface Map<T> {
    [key: string]: T;
}

export class Game {
    public players: Array<Player>;
    private userPlayer: Map<Player>;
    public deck: Deck;
    public burnedCards: CardStack;
    public pileOfCards: CardStack;
    public passedBy: Player;
    public turn: number;
    public state: State;
    public numberOfPlayers: number;
    public maxNumberOfPlayers: number;
    public isGameStarted: boolean;
    public pickedCard: Card;
    public leader: Player;
    private readonly MIN_NUMBER_OF_PLAYERS: number = 3;
    private readonly MAX_NUMBER_OF_PLAYERS: number = 8;
    private readonly DEFAULT_NUMBER_OF_CARDS_PER_HAND: number = 4;
    public readonly LEADER_BASED_ACTIONS = [Action.START_GAME, Action.RESTART];
    public readonly USER_TURN_BASED_ACTION = [
        Action.BURN_CARD,
        Action.EXCHANGE_PICK_WITH_HAND,
        Action.PASS,
        Action.USE_ABILITY,
        Action.THROW_CARD,
        Action.PICK_CARD_FROM_BURNED,
        Action.PICK_CARD_FROM_PILE,
    ];
    public readonly INTERNALT_BASED_ACTION = [
        Action.START_GAME,
        Action.DISTRBUTE_CARD,
        Action.SELECT_FIRST_TURN,
        Action.NEXT_TURN,
    ];
    public readonly USER_BASED_ACTION = [
        Action.JOIN_AS_PLAYER,
        Action.JOIN_AS_SPECTATOR,
        Action.LEAVE,
    ];

    constructor(maxNumberOfPlayers: number) {
        if (!this.isValidMaxNumberOfPlayers(maxNumberOfPlayers)) {
            throw new Error('Invalid maximum number of players');
        }

        this.maxNumberOfPlayers = maxNumberOfPlayers;
        this.numberOfPlayers = 0;
        this.players = new Array<Player>(maxNumberOfPlayers);
        this.deck = new Deck();
        this.burnedCards = new CardStack();
        this.pileOfCards = new CardStack();
        this.state = new Prepare(this);
        this.isGameStarted = false;
        this.pickedCard = null;
    }

    public setLeader(userId: number) {
        this.leader = this.userPlayer[userId];
    }

    public setState(state: State): void {
        this.state = state;
    }

    public validateUsingActionBased(action: Action, userId?: number): boolean {
        const isIn = (_action: Action) => _action === action;
        if (this.LEADER_BASED_ACTIONS.some(isIn)) {
            return this.isLeaderUser(userId);
        } else if (this.USER_BASED_ACTION.some(isIn)) {
            return userId !== null && userId !== undefined;
        } else if (this.USER_TURN_BASED_ACTION.some(isIn)) {
            return this.isUserTurn(userId);
        } else {
            // todo check if needed
            return (userId === null || userId === undefined) && this.INTERNALT_BASED_ACTION.some(isIn);
        }
    }

    public action(action: Action, payload?: UserAction) {
        if (!this.validateUsingActionBased(action, payload.userId)) {
            throw InvalidAction;
        }

        // global avilable actions
        switch (action) {
            case Action.JOIN_AS_PLAYER: // same state
            case Action.JOIN_AS_SPECTATOR: // same state
            case Action.LEAVE:
            // this.doSomething();

            default:
                this.state.action(action, payload);
        }
    }

    public nextTurn() {
        this.turn = (this.turn + 1) % this.players.length;
    }

    public startGameAction(userId: number) {
        if (this.isGameStarted) {
            throw new InvalidAction('Game already started');
        }

        this.isGameStarted = true;
        this.deck.shuffle();
    }

    public distributeCardsAction() {
        this.players.forEach((player: Player) => {
            const handCards = new CardHand();
            for (let i = 1; i <= this.DEFAULT_NUMBER_OF_CARDS_PER_HAND; ++i) {
                handCards.add(this.deck.pop());
            }

            player.setHandCards(handCards);
        });

        while (!this.deck.isEmpty()) {
            this.pileOfCards.put(this.deck.pop());
        }
    }

    public selectFirstTurnAction() {
        if (this.turn === null) {
            const randomTurn = Math.floor(Math.random() * this.players.length);
            this.turn = randomTurn;
        } else {
            this.nextTurn();
        }
    }

    public pickCardFromPileAction(userId: number) {
        this.pickedCard = this.pileOfCards.pick();
    }

    public pickCardFromStackAction(userId: number) {
        this.pickedCard = this.burnedCards.pick();
    }

    public burnOneHandCardAction(userId: number, cardId: string) {
        const player = this.userPlayer[userId];
        const card = player.getCard(cardId);
        const topBurendCard = this.burnedCards.top;
        if (card.equalsRank(topBurendCard)) {
            player.handCards.remove(card);
            this.burnedCards.put(card);
        } else {
            player.handCards.add(this.burnedCards.pick());
        }
    }

    public useAbilityAction(userId: number) {
        const player = this.userPlayer[userId];
        const cardAction = this.pickedCard.getAbility();
    }

    public throwCardAction(userId: number) {
        if (this.pickedCard.isUsed()) {
            // go to burn state
        } else {
            // go to ability state
        }
    }

    public exchangePickWithHandAction(userId: number, cardId: string) {
        const player = this.userPlayer[userId];
        let card = player.getCard(cardId);
        let pickedCard = this.pickedCard;
        [pickedCard, card] = [card, pickedCard];
    }

    public exchangeHandWithOther(userId: number, cardId: string, otherPlayerId: number, otherCardId: string) {
        if (this.isValidPlayer(otherPlayerId)) {
            const player = this.userPlayer[userId];
            const otherPlayer = this.players[otherPlayerId];
            if (player === otherPlayer) {
                throw new InvalidAction('Changing card with your self is not allowed');
            }

            let playerCard = player.getCard(cardId);
            let otherPlayerCard = otherPlayer.getCard(otherCardId);

            [playerCard, otherPlayerCard] = [otherPlayerCard, playerCard];
        } else {
            throw new InvalidAction('Pick valid card your turn.');
        }
    }

    public showOneHandCardAction(userId: number, cardId: string) {
        const card = this.userPlayer[userId].getCard(cardId);
        // emit with card suit, rank
    }

    public showOneOtherHandCardAction(userId: number, otherPlayerId: number, otherCardId: string) {
        if (this.isValidPlayer(otherPlayerId)) {
            const card = this.players[otherPlayerId].getCard(otherCardId);
            // emit with card suit, rank
        } else {
            throw new InvalidAction('Pick valid card');
        }
    }

    public passAction(userId: number) {
        this.passedBy = this.players[this.turn];
    }

    // user/turn action, game action, leader action
    public restartAction(userId: number) {
        // @todo function reset
    }

    public joinAsPlayerAction() {

    }

    public joinAsSpectatorAction() {

    }

    public leaveAction() {

    }

    // @todo
    public endOfTurn() {
        this.pickedCard = null;
    }

    public isUserTurn(userId: number) {
        return this.players[this.turn].isOwner(userId);
    }

    public isValidMaxNumberOfPlayers(numberOfPlayers: number): boolean {
        return this.MIN_NUMBER_OF_PLAYERS <= numberOfPlayers && numberOfPlayers <= this.MAX_NUMBER_OF_PLAYERS;
    }

    public isLeaderUser(userId: number) {
        return this.leader === this.userPlayer[userId];
    }

    public isValidPlayer(playerId: number): boolean {
        return 0 <= playerId && playerId < this.players.length;
    }
}