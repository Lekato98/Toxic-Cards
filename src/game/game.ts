import { Card } from "./card";
import { CardHand } from "./card-hand";
import { CardStack } from "./card-stack";
import { Deck } from "./deck";
import { Player } from "./player";
import { PrepareState } from "./state/prepare-state";
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
    PICK_CARD_FROM_STACK, // user id
    BURN_CARD, // user id, card id
    THROW_CARD_AND_USE_ABILITY, // user id, card id
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

interface Map<T> {
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
        this.state = new PrepareState(this);
        this.isGameStarted = false;
        this.pickedCard = null;
    }

    public setLeader(userId: number) {
        // @todo
        this.leader = this.userPlayer[userId];
    }

    public setState(state: State): void {
        this.state = state;
    }

    public action(action: Action, payload?: UserAction) {
        // global avilable actions
        switch(action) {
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
        if (!this.isLeaderUser(userId)) {
            throw new InvalidAction('Only leader can start game');
        }

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

        while(!this.deck.isEmpty()) {
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
        if (this.isUserTurn(userId)) {
            this.pickedCard = this.pileOfCards.pick();
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public pickCardFromStackAction(userId: number) {
        if (this.isUserTurn(userId)) {
            this.pickedCard = this.burnedCards.pick();
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public burnCardAction(userId: number, cardId: string) {
        if (this.isUserTurn(userId)) {
            const player = this.userPlayer[userId];
            const card = player.getCard(cardId);
            const topBurendCard = this.burnedCards.top;
            if (card.equalsRank(topBurendCard)) {
                player.handCards.remove(card);
                this.burnedCards.put(card);
            } else {
                player.handCards.add(this.burnedCards.pick());
            }
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public useAbilityAction(userId: number) {
        if (this.isUserTurn(userId)) {
            const player = this.userPlayer[userId];
            const cardAction = this.pickedCard.getAbility();
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public throwCardAction(userId: number) {
        if (this.isUserTurn(userId)) {
            if (this.pickedCard.isUsed()) {
                // go to burn state
            } else {
                // go to ability state
            }
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public exchangePickWithHandAction(userId: number, cardId: string) {
        if (this.isUserTurn(userId)) {
            const player = this.userPlayer[userId];
            let card = player.getCard(cardId);
            let pickedCard = this.pickedCard;
            [pickedCard, card] = [card, pickedCard];
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public exchangeHandWithOther(userId: number, cardId: string, otherPlayerId: number, otherCardId: string) {
        if (this.isUserTurn(userId) && this.isValidPlayer(otherPlayerId)) {
            const player = this.userPlayer[userId];
            const otherPlayer = this.players[otherPlayerId];
            if (player === otherPlayer) {
                throw new InvalidAction('Changing card with your self is not allowed');
            }

            let playerCard = player.getCard(cardId);
            let otherPlayerCard = otherPlayer.getCard(otherCardId);

            [playerCard, otherPlayerCard] = [otherPlayerCard, playerCard];
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public showOneHandCardAction(userId: number, cardId: string) {
        if (this.isUserTurn(userId)) {
            const card = this.userPlayer[userId].getCard(cardId);
            // emit with card suit, rank
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public showOneOtherHandCardAction(userId: number, otherPlayerId: number, otherCardId: string) {
        if (this.isUserTurn(userId) && this.isValidPlayer(otherPlayerId)) {
            const card = this.players[otherPlayerId].getCard(otherCardId);
            // emit with card suit, rank
        } else {
            throw new InvalidAction('Wait your turn.');
        }
    }

    public passAction(userId: number) {
        if (this.isUserTurn(userId)) {
            this.passedBy = this.players[this.turn];
        } else {
            throw new InvalidAction('Wait your turn');
        }
    }

    // user/turn action, game action, leader action
    public restartAction(userId: number) {
        if (this.isLeaderUser(userId)) {
            // @todo function reset
        } else {
            throw new InvalidAction('Only leader can restart the game');
        }
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