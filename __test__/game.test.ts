import { Action, Game, InvalidAction } from '../src/game/game';
import { BeginOfGame } from '../src/game/state/begin-of-game';
import { BeginOfRound } from '../src/game/state/begin-of-round';
import { PickBurn } from '../src/game/state/pick-burn';
import { PilePicked } from '../src/game/state/pile-picked';
import { Burn } from '../src/game/state/burn';
import { EndOfTurn } from '../src/game/state/end-of-turn';
import { BeginOfTurn } from '../src/game/state/begin-of-turn';
import { BurnedPicked } from '../src/game/state/burned-picked';
import { Card, CardColor, CardRank, CardSuit, CardUtil } from '../src/game/card';
import { EndOfGame } from '../src/game/state/end-of-game';
import { ExchangeHandWithOther } from '../src/game/state/exchange-hand-with-other';
import { ShowOneHandCard } from '../src/game/state/show-one-hand-card';
import { ShowOneOtherHandCard } from '../src/game/state/show-one-other-hand-card';
import { Deck } from '../src/game/deck';
import { GameSocketService } from '../src/socket/socket';

describe('Test Game', () => {
    const usersId = [0, 1, 2];
    let game: Game;
    GameSocketService.emitRoom = () => ({});
    GameSocketService.emitUser = () => ({});

    test('Test InvalidAction Error', () => {
        const error = new InvalidAction();
        expect(error.message).toBeTruthy();
    });

    test('Create Game with creator id', () => {
        const maxNumberOfPlayers = 5;
        const initialState = BeginOfGame.getInstance();
        const tGame = new Game(maxNumberOfPlayers, initialState, usersId[0]);
        expect(tGame.leader).toBe(usersId[0]);
        expect(tGame.numberOfPlayers).toBe(1);
    });

    test('Create Game with invalid number of players', () => {
        const maxNumberOfPlayers = 0;
        const initialState = BeginOfGame.getInstance();
        const mock = () => new Game(maxNumberOfPlayers, initialState);
        expect(mock).toThrow(Error);
    });

    test('Create Game With 3 players', () => {
        const maxNumberOfPlayers = 3;
        const initialState = BeginOfGame.getInstance();
        game = new Game(maxNumberOfPlayers, initialState);
        expect(game.burnedCards.isEmpty()).toBe(true);
        expect(game.burnedCards.getSize()).toBe(0);
        expect(game.isGameStarted).toBe(false);
        expect(game.isFull()).toBe(false);
        expect(game.numberOfPlayers).toBe(0);
        expect(game.leader).toBeNull();
        expect(game.passedBy).toBeNull();
        expect(game.players.length).toBe(maxNumberOfPlayers);
    });

    test('Spectator 1 JOIN_AS_SPECTATOR', () => {
        const userId = 5;
        game.action(Action.JOIN_AS_SPECTATOR, {userId});
        expect(game.numberOfSpectators).toBe(1);
        expect(game.isJoinedAsSpectator(userId)).toBeTruthy();
    });

    test('Spectator 1 LEAVE', () => {
        const userId = 5;
        game.action(Action.LEAVE, {userId});
        expect(game.numberOfSpectators).toBe(0);
        expect(game.isJoinedAsSpectator(userId)).toBeFalsy();
    });

    test('Spectator 1 invalid action trying to leave but already left LEAVE', () => {
        const userId = 5;
        const mock = () => game.action(Action.LEAVE, {userId});
        expect(mock).toThrow(InvalidAction);
    });

    test('User 1 JOIN_AS_PLAYER', () => {
        const userId = usersId[0];
        game.action(Action.JOIN_AS_PLAYER, {userId: userId, playerId: 0});
        expect(game.leader).toBe(userId);
        expect(game.isGameStarted).toBe(false);
        expect(game.numberOfPlayers).toBe(1);
        expect(game.isLeaderUser(userId)).toBe(true);
        expect(game.isJoinedAsPlayer(userId)).toBe(true);
        expect(game.isFull()).toBe(false);
    });

    test('User 1 trying to join as player one more time JOIN_AS_PLAYER', () => {
        const userId = usersId[0];
        const mock = () => game.action(Action.JOIN_AS_PLAYER, {userId: userId, playerId: 0});
        expect(mock).toThrow(InvalidAction);
    });

    test('User 2 JOIN_AS_PLAYER', () => {
        const userId = usersId[1];
        game.action(Action.JOIN_AS_PLAYER, {userId: userId, playerId: 1});
        expect(game.leader).toBe(usersId[0]);
        expect(game.isGameStarted).toBeFalsy();
        expect(game.numberOfPlayers).toBe(2);
        expect(game.isLeaderUser(userId)).toBeFalsy();
        expect(game.isJoinedAsPlayer(userId)).toBeTruthy();
        expect(game.isFull()).toBeFalsy();
    });

    test('User 2 trying to make leader action JOIN_AS_PLAYER', () => {
        const userId = usersId[1];
        const mock = () => game.action(Action.START_GAME, {userId});
        expect(mock).toThrow(InvalidAction);
    });

    test('User 3 JOIN_AS_PLAYER', () => {
        const userId = usersId[2];
        game.action(Action.JOIN_AS_PLAYER, {userId, playerId: 2});
        expect(game.leader).toBe(usersId[0]);
        expect(game.isGameStarted).toBeFalsy();
        expect(game.numberOfPlayers).toBe(3);
        expect(game.isLeaderUser(userId)).toBeFalsy();
        expect(game.isJoinedAsPlayer(userId)).toBeTruthy();
        expect(game.isFull()).toBeTruthy();
    });

    test('User 4 invalid trying to reach max limit JOIN_AS_PLAYER', () => {
        const userId = 4;
        const mock = () => game.action(Action.JOIN_AS_PLAYER, {userId, playerId: 2});

        expect(mock).toThrow(InvalidAction);
    });

    test('User 4 invalid trying to join with unknown playerId JOIN_AS_PLAYER', () => {
        const userId = 4;
        const mock = () => game.action(Action.JOIN_AS_PLAYER, {userId: userId, playerId: 5});

        expect(mock).toThrow(InvalidAction);
    });

    test('Leader trying to start game while game is started START_GAME', () => {
        const userId = usersId[0];
        const tempMock = game.isGameStarted;
        game.isGameStarted = true;

        const mock = () => game.action(Action.START_GAME, {userId});
        expect(mock).toThrow(InvalidAction);

        game.isGameStarted = tempMock;
    });

    test('Leader User START_GAME', () => {
        const userId = usersId[0];
        const tempMock = game.beginOfRoundAction;
        game.beginOfRoundAction = () => ({});

        expect(game.state).toBeInstanceOf(BeginOfGame);
        game.action(Action.START_GAME, {userId: userId});
        expect(game.isGameStarted).toBe(true);
        expect(game.state).toBeInstanceOf(BeginOfRound);
        expect(game.turn).toBeDefined();

        game.beginOfRoundAction = tempMock;
    });

    test('Internal Call START_ROUND', () => {
        const randomPlayer = game.players[0];
        const numberOfCardsInNormalSet = 52;
        const tempMock = game.beginOfTurnAction;
        game.beginOfTurnAction = () => ({});

        expect(randomPlayer.handCards.isEmpty()).toBeTruthy();
        game.action(Action.BEGIN_OF_ROUND);
        expect(game.pileOfCards.getSize()).toBe(numberOfCardsInNormalSet - usersId.length * game.DEFAULT_NUMBER_OF_CARDS_PER_HAND);
        expect(randomPlayer.handCards.getSize()).toBe(game.DEFAULT_NUMBER_OF_CARDS_PER_HAND);
        expect(game.state).toBeInstanceOf(BeginOfTurn);

        game.beginOfTurnAction = tempMock;
    });

    test('User 1 trying to call an internal action BEGIN_OF_TURN', () => {
        const userId = game.turn;
        const mock = () => game.action(Action.BEGIN_OF_TURN, {userId});
        expect(mock).toThrow(InvalidAction);
    });

    test('First Turn BEGIN_OF_TURN', () => {
        game.action(Action.BEGIN_OF_TURN);
        expect(game.state).toBeInstanceOf(PickBurn);
    });

    test('First Turn invalid action when try to burn one hand card PICK_BURN', () => {
        const userId = game.turn;
        const mock = () => game.action(Action.BURN_ONE_HAND_CARD, {userId});
        expect(mock).toThrow(InvalidAction);
    });

    test('First Turn invalid action when try to pick from burned cards PICK_BURN', () => {
        const userId = game.turn;
        const mock = () => game.action(Action.PICK_CARD_FROM_BURNED, {userId});
        expect(mock).toThrow(InvalidAction);
    });

    test('First Turn pick from pile PICK_BURN', () => {
        const userId = game.turn;
        const pileOfCards = game.pileOfCards;
        const newSize = pileOfCards.getSize() - 1;
        const pileCard = game.pileOfCards.top;
        game.action(Action.PICK_CARD_FROM_PILE, {userId});
        expect(game.state).toBeInstanceOf(PilePicked);
        expect(game.pickedCard).toBe(pileCard);
        expect(game.pileOfCards.getSize()).toBe(newSize);
    });

    test('First Turn EXCHANGE_PICK_WITH_HAND in PICK_BURN', () => {
        const userId = game.turn;
        const pickedCardId = game.pickedCard.id;
        const player = game.getPlayerByUserId(userId);
        const randomCardOrder = Math.floor(Math.random() * player.handCards.getSize());
        const randomCard = player.handCards.getCardByOrder(randomCardOrder);
        const cardId = randomCard.id;
        const tempMock = game.burnAction;
        game.burnAction = () => ({});

        game.action(Action.EXCHANGE_PICK_WITH_HAND, {userId, cardId: randomCard.id});

        expect(game.pickedCard.id).toEqual(cardId);
        expect(game.pickedCard.id).not.toEqual(pickedCardId);
        expect(game.state).toBeInstanceOf(Burn);

        game.burnAction = tempMock;
    });

    test('First Turn in BURN', () => {
        const pickedCard = game.pickedCard;
        const tempMock = game.endOfTurnAction;
        game.endOfTurnAction = () => ({});

        game.action(Action.BURN_CARD);
        expect(game.burnedCards.top).toBe(pickedCard);
        expect(game.pickedCard).toBeNull();
        expect(game.state).toBeInstanceOf(EndOfTurn);

        game.endOfTurnAction = tempMock;
    });

    test('First Turn in END_OF_TURN', () => {
        const currentTurn = (game.turn + 1) % game.maxNumberOfPlayers;
        const tempMock = game.beginOfTurnAction;
        game.beginOfTurnAction = () => ({});

        game.action(Action.END_OF_TURN);
        expect(game.turn).toEqual(currentTurn);
        expect(game.state).toBeInstanceOf(BeginOfTurn);

        game.beginOfTurnAction = tempMock;
    });

    test('Second Turn in BEGIN_OF_TURN', () => {
        game.action(Action.BEGIN_OF_TURN);
        expect(game.state).toBeInstanceOf(PickBurn);
    });

    test('Second Turn PICK_CARD_FROM_BURNED in PICK_BURN', () => {
        const userId = game.turn;
        const burnedTop = game.burnedCards.top;

        expect(game.pickedCard).toBeNull();
        game.action(Action.PICK_CARD_FROM_BURNED, {userId});
        game.action(Action.PASS, {userId});
        expect(game.pickedCard).toBe(burnedTop);
        expect(game.state).toBeInstanceOf(BurnedPicked);
    });

    test('Second Turn EXCHANGE_PICK_WITH_HAND in BURNED_PICKED', () => {
        const userId = game.turn;
        const pickedCardId = game.pickedCard.id;
        const player = game.getPlayerByUserId(userId);
        const randomCardOrder = Math.floor(Math.random() * player.handCards.getSize());
        const randomCard = player.handCards.getCardByOrder(randomCardOrder);
        const cardId = randomCard.id;
        const tempMock = game.burnAction;
        game.burnAction = () => ({});

        game.action(Action.EXCHANGE_PICK_WITH_HAND, {userId, cardId: randomCard.id});
        expect(game.pickedCard.id).toEqual(cardId);
        expect(game.pickedCard.id).not.toEqual(pickedCardId);
        expect(game.state).toBeInstanceOf(Burn);

        game.burnAction = tempMock;

        game.action(Action.BURN_CARD);
        expect(game.state).toBeInstanceOf(PickBurn);
    });

    test('Third Turn BURN_ONE_HAND_CARD in BURNED_PICKED', () => {
        const userId = game.turn;
        const player = game.getPlayerByUserId(userId);
        const oldSize = player.handCards.getSize();
        const burnedTop = game.burnedCards.top;
        const randomCardOrder = Math.floor(Math.random() * player.handCards.getSize());
        const randomCard = player.handCards.getCardByOrder(randomCardOrder);
        const cardId = randomCard.id;

        const tempMock = game.endOfTurnAction;
        game.endOfTurnAction = () => ({});

        game.action(Action.BURN_ONE_HAND_CARD, {userId, cardId});
        expect(player.handCards.getSize()).not.toEqual(oldSize);

        if (oldSize > player.handCards.getSize()) { // if success burn
            expect(game.burnedCards.top).toBe(randomCard);
        } else { // if fail burn
            expect(player.handCards.contains(burnedTop)).toBeTruthy();
        }

        expect(game.state).toBeInstanceOf(EndOfTurn);

        game.endOfTurnAction = tempMock;

        game.action(Action.END_OF_TURN);
        expect(game.state).toBeInstanceOf(PickBurn);
    });

    test('Third Turn User 1 pick pile card the use ability PICK_BURN', () => {
        const userId = game.turn;
        const player = game.getPlayerByUserId(userId);
        const randomCard = player.handCards.getCardByOrder(1);
        const cardId = randomCard.id;
        const otherPlayerId = (userId + 1) % 3;
        const randomPlayer = game.getPlayerByUserId(otherPlayerId);
        const randomOtherCard = randomPlayer.handCards.getCardByOrder(1);
        const otherCardId = randomOtherCard.id;
        const mock = () => randomPlayer.handCards.getCardByOrder(53);
        const anotherMock = () => game.action(Action.PICK_CARD_FROM_PILE, {userId});
        const tempMock = game.burnAction;
        game.burnAction = () => ({});

        game.action(Action.PICK_CARD_FROM_PILE, {userId});
        expect(game.state).toBeInstanceOf(PilePicked);

        game.pickedCard = new Card(CardSuit.SPADES, CardRank.FIVE);
        expect(CardUtil.getColor(game.pickedCard)).toBe(CardColor.BLACK);
        expect(CardUtil.isBlack(game.pickedCard)).toBeTruthy();
        expect(CardUtil.isBlack(CardSuit.DIAMONDS)).toBeFalsy();
        expect(CardUtil.isKing(game.pickedCard)).toBeFalsy();
        game.action(Action.THROW_CARD, {userId});
        expect(mock).toThrow(Error);

        expect(anotherMock).toThrow(InvalidAction);
        expect(game.state).toBeInstanceOf(Burn);

        game.setState(PilePicked.getInstance());
        game.pickedCard = new Card(CardSuit.DIAMONDS, CardRank.JACK);
        expect(CardUtil.isRed(game.pickedCard)).toBeTruthy();
        expect(CardUtil.getColor(game.pickedCard)).toBe(CardColor.RED);
        game.action(Action.THROW_CARD, {userId});
        expect(anotherMock).toThrow(InvalidAction);
        expect(game.state).toBeInstanceOf(ExchangeHandWithOther);
        game.action(Action.EXCHANGE_HAND_WITH_OTHER, {userId, cardId, otherPlayerId, otherCardId});

        // cardId becomes otherCardId and vice versa
        game.setState(PilePicked.getInstance());
        game.pickedCard = new Card(CardSuit.CLUBS, CardRank.SEVEN);
        game.action(Action.THROW_CARD, {userId});
        expect(anotherMock).toThrow(InvalidAction);
        expect(game.state).toBeInstanceOf(ShowOneHandCard);
        game.action(Action.SHOW_ONE_HAND_CARD, {userId, cardId: otherCardId});

        game.setState(PilePicked.getInstance());
        game.pickedCard = new Card(CardSuit.CLUBS, CardRank.TEN);

        game.burnAction = tempMock;
        game.action(Action.THROW_CARD, {userId});
        expect(anotherMock).toThrow(InvalidAction);
        expect(game.state).toBeInstanceOf(ShowOneOtherHandCard);
        game.action(Action.SHOW_ONE_OTHER_HAND_CARD, {userId, otherPlayerId, otherCardId: cardId});

        expect(anotherMock).toThrow(InvalidAction);
        expect(game.state).toBeInstanceOf(EndOfGame);
    });

    test('User 3 LEAVE', () => {
        const userId = usersId[2];
        const oldNumberOfPlayers = game.numberOfPlayers;
        const newNumberOfPlayers = oldNumberOfPlayers - 1;
        game.action(Action.LEAVE, {userId});
        expect(game.numberOfPlayers).toBe(newNumberOfPlayers);
        expect(game.isFull()).toBeFalsy();
    });

    test('Deck create invalid deck with negative size', () => {
        const mock = () => new Deck(-1);
        expect(mock).toThrow(Error);
    });
});
