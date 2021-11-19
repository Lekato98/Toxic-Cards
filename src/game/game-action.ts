import {BeginOfRound} from './state/begin-of-round';
import {BeginOfTurn} from './state/begin-of-turn';
import {EndOfRound} from './state/end-of-round';
import {PickBurn} from './state/pick-burn';
import {Player} from './player';
import {Utils} from './utils';
import {Event, GameSocketService} from '../socket/socket';
import {PilePicked} from './state/pile-picked';
import {BurnedPicked} from './state/burned-picked';
import {EndOfTurn} from './state/end-of-turn';
import {CardAbility, CardUtil} from './card';
import {ExchangeHandWithOther} from './state/exchange-hand-with-other';
import {ShowOneHandCard} from './state/show-one-hand-card';
import {ShowOneOtherHandCard} from './state/show-one-other-hand-card';
import {Burn} from './state/burn';
import {EndOfGame} from './state/end-of-game';
import {BeginOfGame} from './state/begin-of-game';
import {Game, InvalidAction} from './game';

export class GameAction {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public beginOfGameAction() {
        // @todo check if can start game, check num of players, or add bots etc ..
        if (this.game.isGameStarted) {
            throw new InvalidAction('Game already started');
        }

        this.game.isGameStarted = true;
        this.selectFirstTurnAction();
        this.game.setState(BeginOfRound.getInstance());
    }

    public beginOfRoundAction() {
        ++this.game.numberOfRounds;
        this.game.deck.shuffle();
        this.distributeCardsAction();
        this.showTwoHandCardsAction();
        this.game.nextTurn();
        this.game.setState(BeginOfTurn.getInstance(), true);
    }

    public beginOfTurnAction(): void {
        if (this.game.passedBy === this.game.players[this.game.turn]) {
            return this.game.setState(EndOfRound.getInstance());
        }

        this.game.setState(PickBurn.getInstance());
    }

    public distributeCardsAction() {
        this.game.players.forEach((_player: Player) => {
            for (let i = 1; i <= this.game.DEFAULT_NUMBER_OF_CARDS_PER_HAND; ++i) {
                if (!_player.isOut) {
                    _player.addCardToHand(this.game.deck.pop());
                }
            }
        });

        while (!this.game.deck.isEmpty()) {
            this.game.pileOfCards.put(this.game.deck.pop());
        }
    }

    public showTwoHandCardsAction() {
        this.game.players.forEach((_player: Player) => !_player.isOut && _player.showTwoHandCards());
    }

    public selectFirstTurnAction() {
        this.game.turn = Utils.randomIndex(this.game.players);
    }

    public pickCardFromPileAction() {
        const pickedCard = this.game.pileOfCards.pick();
        this.game.pickedCard = pickedCard;
        const userId = this.game.players[this.game.turn].getUserId();
        GameSocketService.emitUser(Event.STATUS, userId, {pickedCard: pickedCard.toShow(), isBurnedCard: false});
        this.game.setState(PilePicked.getInstance());
    }

    public pickCardFromBurnedAction() {
        if (this.game.burnedCards.isEmpty()) {
            throw new InvalidAction('Burned cards stack is empty');
        }

        const pickedCard = this.game.burnedCards.pick();
        this.game.pickedCard = pickedCard;
        const userId = this.game.players[this.game.turn].getUserId();
        GameSocketService.emitUser(Event.STATUS, userId, {pickedCard: pickedCard.toShow(), isBurnedCard: true});
        this.game.setState(BurnedPicked.getInstance());
    }

    public burnOneHandCardAction(userId: number, cardId: string) {
        if (this.game.burnedCards.isEmpty()) {
            throw new InvalidAction('Burned cards stack is empty');
        }

        const player = this.game.getPlayerByUserId(userId);
        if (player.handCards.isFull()) {
            throw new InvalidAction('Hand cards is full!');
        }

        if (!this.game.isValidPlayerCard(player.id, cardId)) {
            throw new InvalidAction('Invalid picked card');
        }

        const card = player.getCard(cardId);
        const topBurnedCard = this.game.burnedCards.top;
        if (card.equalsRank(topBurnedCard)) {
            player.handCards.remove(card);
            this.game.burnedCards.put(card);
        } else {
            player.handCards.add(this.game.burnedCards.pick());
        }

        this.game.setState(EndOfTurn.getInstance());
    }

    public useAbilityAction(): void {
        const pickedCard = this.game.pickedCard;
        const cardAbility = pickedCard.getAbility();
        pickedCard.markAsUsed();
        switch (cardAbility) {
            case CardAbility.EXCHANGE_HAND_WITH_OTHER:
                return this.game.setState(ExchangeHandWithOther.getInstance());

            case CardAbility.SHOW_ONE_HAND_CARD:
                return this.game.setState(ShowOneHandCard.getInstance());

            case CardAbility.SHOW_ONE_OTHER_HAND_CARD:
                return this.game.setState(ShowOneOtherHandCard.getInstance());

            case CardAbility.NO_ABILITY:
                return this.game.setState(Burn.getInstance());

            default:
                throw new InvalidAction('Unknown ability');
        }
    }

    public exchangePickWithHandAction(userId: number, cardId: string) {
        const player = this.game.getPlayerByUserId(userId);
        if (!this.game.isValidPlayerCard(player.id, cardId)) {
            throw new InvalidAction('Pick a valid card');
        }

        const card = player.getCard(cardId);
        const pickedCard = this.game.pickedCard;
        CardUtil.swap(card, pickedCard);
        this.game.setState(Burn.getInstance());
    }

    public exchangeHandWithOther(userId: number, cardId: string, otherPlayerId: number, otherCardId: string) {
        if (this.game.isValidPlayer(otherPlayerId) && this.game.isValidPlayerCard(otherPlayerId, otherCardId)) {
            const player = this.game.getPlayerByUserId(userId);
            const otherPlayer = this.game.players[otherPlayerId];
            if (player === otherPlayer) {
                throw new InvalidAction('Changing card with your self is not allowed');
            } else if (!this.game.isValidPlayerCard(player.id, cardId)) {
                throw new InvalidAction('Pick a valid card');
            }

            const playerCard = player.getCard(cardId);
            const otherPlayerCard = otherPlayer.getCard(otherCardId);
            CardUtil.swap(playerCard, otherPlayerCard);
            this.game.setState(Burn.getInstance());
        } else {
            throw new InvalidAction('Pick a valid card.');
        }
    }

    public showOneHandCardAction(userId: number, cardId: string) {
        const player = this.game.getPlayerByUserId(userId);
        if (!this.game.isValidPlayerCard(player.id, cardId)) {
            throw new InvalidAction('Pick a valid card');
        }

        const card = player.getCard(cardId);
        GameSocketService.emitUser(Event.STATUS, userId, {card: card.toShow()});
        this.game.setState(Burn.getInstance());
    }

    public showOneOtherHandCardAction(userId: number, otherPlayerId: number, otherCardId: string) {
        if (this.game.isValidPlayer(otherPlayerId) && this.game.isValidPlayerCard(otherPlayerId, otherCardId)) {
            const playerId = this.game.getPlayerByUserId(userId).id;
            if (playerId === otherPlayerId) {
                throw new InvalidAction('Only other hand cards are allowed');
            }

            const card = this.game.players[otherPlayerId].getCard(otherCardId);
            GameSocketService.emitUser(Event.STATUS, userId, {card: card.toShow()});
            this.game.setState(Burn.getInstance());
        } else {
            throw new InvalidAction('Pick valid card');
        }
    }

    public burnAction() {
        this.game.burnedCards.put(this.game.pickedCard);
        this.game.pickedCard = null;
        this.game.setState(EndOfTurn.getInstance());
    }

    public passAction() {
        if (!Utils.isNullOrUndefined(this.game.passedBy)) {
            throw new InvalidAction('There is already player passed');
        }

        this.game.passedBy = this.game.players[this.game.turn];
    }

    public endOfTurnAction(): void {
        this.game.pickedCard = null; // @todo maybe remove it and put it in burn action/resetTurn

        this.game.nextTurn();
        this.game.setState(BeginOfTurn.getInstance());
    }

    public endOfRoundAction(): void {
        this.game.calculateScores(); // calculate first
        this.game.sanitizePlayers(); // then check which player is out

        // then reset
        this.game.players.forEach((_player: Player) => _player.clearHand());
        this.game.pileOfCards.clear();
        this.game.burnedCards.clear();
        this.game.deck.reset();
        this.game.passedBy = null;

        if (this.game.isEndOfGame()) {
            this.game.setState(EndOfGame.getInstance());
        } else {
            this.game.setState(BeginOfRound.getInstance());
        }
    }

    public endOfGameAction() {
        this.game.resetGame();
        this.game.setState(BeginOfGame.getInstance());
        GameSocketService.emitRoom(Event.END_GAME_SOUND, this.game.id);
    }
}
