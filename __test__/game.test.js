"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("../src/game/game");
const begin_of_game_1 = require("../src/game/state/begin-of-game");
const begin_of_round_1 = require("../src/game/state/begin-of-round");
const pick_burn_1 = require("../src/game/state/pick-burn");
const pile_picked_1 = require("../src/game/state/pile-picked");
const burn_1 = require("../src/game/state/burn");
const end_of_turn_1 = require("../src/game/state/end-of-turn");
const begin_of_turn_1 = require("../src/game/state/begin-of-turn");
const burned_picked_1 = require("../src/game/state/burned-picked");
const card_1 = require("../src/game/card");
const exchange_hand_with_other_1 = require("../src/game/state/exchange-hand-with-other");
const show_one_hand_card_1 = require("../src/game/state/show-one-hand-card");
const show_one_other_hand_card_1 = require("../src/game/state/show-one-other-hand-card");
const deck_1 = require("../src/game/deck");
const socket_1 = require("../src/socket/socket");
describe('Test Game', () => {
    const usersId = [0, 1, 2];
    let game;
    socket_1.GameSocketService.emitRoom = () => ({});
    socket_1.GameSocketService.emitUser = () => ({});
    test('Test InvalidAction Error', () => {
        const error = new game_1.InvalidAction();
        expect(error.message).toBeTruthy();
    });
    test('Create Game with creator id', () => {
        const maxNumberOfPlayers = 5;
        const initialState = begin_of_game_1.BeginOfGame.getInstance();
        const tGame = new game_1.Game(maxNumberOfPlayers, initialState, usersId[0]);
        expect(tGame.leader).toBe(usersId[0]);
        expect(tGame.numberOfUserPlayers).toBe(1);
    });
    test('Create Game with invalid number of players', () => {
        const maxNumberOfPlayers = 0;
        const initialState = begin_of_game_1.BeginOfGame.getInstance();
        const mock = () => new game_1.Game(maxNumberOfPlayers, initialState);
        expect(mock).toThrow(Error);
    });
    test('Create Game With 3 players', () => {
        const maxNumberOfPlayers = 3;
        const initialState = begin_of_game_1.BeginOfGame.getInstance();
        game = new game_1.Game(maxNumberOfPlayers, initialState);
        expect(game.burnedCards.isEmpty()).toBe(true);
        expect(game.burnedCards.getSize()).toBe(0);
        expect(game.isGameStarted).toBe(false);
        expect(game.isFull()).toBe(false);
        expect(game.numberOfUserPlayers).toBe(0);
        expect(game.leader).toBeNull();
        expect(game.passedBy).toBeNull();
        expect(game.players.length).toBe(maxNumberOfPlayers);
    });
    test('Spectator 1 JOIN_AS_SPECTATOR', () => {
        const userId = 5;
        game.action(game_1.Action.JOIN_AS_SPECTATOR, { userId });
        expect(game.numberOfSpectators).toBe(1);
        expect(game.isJoinedAsSpectator(userId)).toBeTruthy();
    });
    test('Spectator 1 LEAVE', () => {
        const userId = 5;
        game.action(game_1.Action.LEAVE, { userId });
        expect(game.numberOfSpectators).toBe(0);
        expect(game.isJoinedAsSpectator(userId)).toBeFalsy();
    });
    test('Spectator 1 invalid action trying to leave but already left LEAVE', () => {
        const userId = 5;
        const mock = () => game.action(game_1.Action.LEAVE, { userId });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('User 1 JOIN_AS_PLAYER', () => {
        const userId = usersId[0];
        game.action(game_1.Action.JOIN_AS_PLAYER, { userId: userId, playerId: 0 });
        expect(game.leader).toBe(userId);
        expect(game.isGameStarted).toBe(false);
        expect(game.numberOfUserPlayers).toBe(1);
        expect(game.isLeaderUser(userId)).toBe(true);
        expect(game.isJoinedAsPlayer(userId)).toBe(true);
        expect(game.isFull()).toBe(false);
    });
    test('User 1 trying to join as player one more time JOIN_AS_PLAYER', () => {
        const userId = usersId[0];
        const mock = () => game.action(game_1.Action.JOIN_AS_PLAYER, { userId: userId, playerId: 0 });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('User 2 JOIN_AS_PLAYER', () => {
        const userId = usersId[1];
        game.action(game_1.Action.JOIN_AS_PLAYER, { userId: userId, playerId: 1 });
        expect(game.leader).toBe(usersId[0]);
        expect(game.isGameStarted).toBeFalsy();
        expect(game.numberOfUserPlayers).toBe(2);
        expect(game.isLeaderUser(userId)).toBeFalsy();
        expect(game.isJoinedAsPlayer(userId)).toBeTruthy();
        expect(game.isFull()).toBeFalsy();
    });
    test('User 2 trying to make leader action JOIN_AS_PLAYER', () => {
        const userId = usersId[1];
        const mock = () => game.action(game_1.Action.START_GAME, { userId });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('User 3 JOIN_AS_PLAYER', () => {
        const userId = usersId[2];
        game.action(game_1.Action.JOIN_AS_PLAYER, { userId, playerId: 2 });
        expect(game.leader).toBe(usersId[0]);
        expect(game.isGameStarted).toBeFalsy();
        expect(game.numberOfUserPlayers).toBe(3);
        expect(game.isLeaderUser(userId)).toBeFalsy();
        expect(game.isJoinedAsPlayer(userId)).toBeTruthy();
        expect(game.isFull()).toBeTruthy();
    });
    test('User 4 invalid trying to reach max limit JOIN_AS_PLAYER', () => {
        const userId = 4;
        const mock = () => game.action(game_1.Action.JOIN_AS_PLAYER, { userId, playerId: 2 });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('User 4 invalid trying to join with unknown playerId JOIN_AS_PLAYER', () => {
        const userId = 4;
        const mock = () => game.action(game_1.Action.JOIN_AS_PLAYER, { userId: userId, playerId: 5 });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('Leader trying to start game while game is started START_GAME', () => {
        const userId = usersId[0];
        const tempMock = game.isGameStarted;
        game.isGameStarted = true;
        const mock = () => game.action(game_1.Action.START_GAME, { userId });
        expect(mock).toThrow(game_1.InvalidAction);
        game.isGameStarted = tempMock;
    });
    test('Leader User START_GAME', () => {
        const userId = usersId[0];
        const tempMock = game.beginOfRoundAction;
        game.beginOfRoundAction = () => ({});
        expect(game.state).toBeInstanceOf(begin_of_game_1.BeginOfGame);
        game.action(game_1.Action.START_GAME, { userId: userId });
        expect(game.isGameStarted).toBe(true);
        expect(game.state).toBeInstanceOf(begin_of_round_1.BeginOfRound);
        expect(game.turn).toBeDefined();
        game.beginOfRoundAction = tempMock;
    });
    test('Internal Call START_ROUND', () => {
        const randomPlayer = game.players[0];
        const numberOfCardsInNormalSet = 52;
        const tempMock = game.beginOfTurnAction;
        game.beginOfTurnAction = () => ({});
        expect(randomPlayer.handCards.isEmpty()).toBeTruthy();
        game.action(game_1.Action.BEGIN_OF_ROUND);
        expect(game.pileOfCards.getSize()).toBe(numberOfCardsInNormalSet - usersId.length * game.DEFAULT_NUMBER_OF_CARDS_PER_HAND);
        expect(randomPlayer.handCards.getSize()).toBe(game.DEFAULT_NUMBER_OF_CARDS_PER_HAND);
        expect(game.state).toBeInstanceOf(begin_of_turn_1.BeginOfTurn);
        game.beginOfTurnAction = tempMock;
    });
    test('User 1 trying to call an internal action BEGIN_OF_TURN', () => {
        const userId = game.turn;
        const mock = () => game.action(game_1.Action.BEGIN_OF_TURN, { userId });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('First Turn BEGIN_OF_TURN', () => {
        game.action(game_1.Action.BEGIN_OF_TURN);
        expect(game.state).toBeInstanceOf(pick_burn_1.PickBurn);
    });
    test('First Turn invalid action when try to burn one hand card PICK_BURN', () => {
        const userId = game.turn;
        const mock = () => game.action(game_1.Action.BURN_ONE_HAND_CARD, { userId });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('First Turn invalid action when try to pick from burned cards PICK_BURN', () => {
        const userId = game.turn;
        const mock = () => game.action(game_1.Action.PICK_CARD_FROM_BURNED, { userId });
        expect(mock).toThrow(game_1.InvalidAction);
    });
    test('First Turn pick from pile PICK_BURN', () => {
        const userId = game.turn;
        const pileOfCards = game.pileOfCards;
        const newSize = pileOfCards.getSize() - 1;
        const pileCard = game.pileOfCards.top;
        game.action(game_1.Action.PICK_CARD_FROM_PILE, { userId });
        expect(game.state).toBeInstanceOf(pile_picked_1.PilePicked);
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
        game.action(game_1.Action.EXCHANGE_PICK_WITH_HAND, { userId, cardId: randomCard.id });
        expect(game.pickedCard.id).toEqual(cardId);
        expect(game.pickedCard.id).not.toEqual(pickedCardId);
        expect(game.state).toBeInstanceOf(burn_1.Burn);
        game.burnAction = tempMock;
    });
    test('First Turn in BURN', () => {
        const pickedCard = game.pickedCard;
        const tempMock = game.endOfTurnAction;
        game.endOfTurnAction = () => ({});
        game.action(game_1.Action.BURN_CARD);
        expect(game.burnedCards.top).toBe(pickedCard);
        expect(game.pickedCard).toBeNull();
        expect(game.state).toBeInstanceOf(end_of_turn_1.EndOfTurn);
        game.endOfTurnAction = tempMock;
    });
    test('First Turn in END_OF_TURN', () => {
        const currentTurn = (game.turn + 1) % game.maxNumberOfPlayers;
        const tempMock = game.beginOfTurnAction;
        game.beginOfTurnAction = () => ({});
        game.action(game_1.Action.END_OF_TURN);
        expect(game.turn).toEqual(currentTurn);
        expect(game.state).toBeInstanceOf(begin_of_turn_1.BeginOfTurn);
        game.beginOfTurnAction = tempMock;
    });
    test('Second Turn in BEGIN_OF_TURN', () => {
        game.action(game_1.Action.BEGIN_OF_TURN);
        expect(game.state).toBeInstanceOf(pick_burn_1.PickBurn);
    });
    test('Second Turn PICK_CARD_FROM_BURNED in PICK_BURN', () => {
        const userId = game.turn;
        const burnedTop = game.burnedCards.top;
        expect(game.pickedCard).toBeNull();
        game.action(game_1.Action.PICK_CARD_FROM_BURNED, { userId });
        game.action(game_1.Action.PASS, { userId });
        expect(game.pickedCard).toBe(burnedTop);
        expect(game.state).toBeInstanceOf(burned_picked_1.BurnedPicked);
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
        game.action(game_1.Action.EXCHANGE_PICK_WITH_HAND, { userId, cardId: randomCard.id });
        expect(game.pickedCard.id).toEqual(cardId);
        expect(game.pickedCard.id).not.toEqual(pickedCardId);
        expect(game.state).toBeInstanceOf(burn_1.Burn);
        game.burnAction = tempMock;
        game.action(game_1.Action.BURN_CARD);
        expect(game.state).toBeInstanceOf(pick_burn_1.PickBurn);
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
        game.action(game_1.Action.BURN_ONE_HAND_CARD, { userId, cardId });
        expect(player.handCards.getSize()).not.toEqual(oldSize);
        if (oldSize > player.handCards.getSize()) {
            expect(game.burnedCards.top).toBe(randomCard);
        }
        else {
            expect(player.handCards.contains(burnedTop)).toBeTruthy();
        }
        expect(game.state).toBeInstanceOf(end_of_turn_1.EndOfTurn);
        game.endOfTurnAction = tempMock;
        game.action(game_1.Action.END_OF_TURN);
        expect(game.state).toBeInstanceOf(pick_burn_1.PickBurn);
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
        const anotherMock = () => game.action(game_1.Action.PICK_CARD_FROM_PILE, { userId });
        const tempMock = game.burnAction;
        game.burnAction = () => ({});
        game.action(game_1.Action.PICK_CARD_FROM_PILE, { userId });
        expect(game.state).toBeInstanceOf(pile_picked_1.PilePicked);
        game.pickedCard = new card_1.Card(card_1.CardSuit.SPADES, card_1.CardRank.FIVE);
        expect(card_1.CardUtil.getColor(game.pickedCard)).toBe(card_1.CardColor.BLACK);
        expect(card_1.CardUtil.isBlack(game.pickedCard)).toBeTruthy();
        expect(card_1.CardUtil.isBlack(card_1.CardSuit.DIAMONDS)).toBeFalsy();
        expect(card_1.CardUtil.isKing(game.pickedCard)).toBeFalsy();
        game.action(game_1.Action.THROW_CARD, { userId });
        expect(mock).toThrow(Error);
        expect(anotherMock).toThrow(game_1.InvalidAction);
        expect(game.state).toBeInstanceOf(burn_1.Burn);
        game.setState(pile_picked_1.PilePicked.getInstance());
        game.pickedCard = new card_1.Card(card_1.CardSuit.DIAMONDS, card_1.CardRank.JACK);
        expect(card_1.CardUtil.isRed(game.pickedCard)).toBeTruthy();
        expect(card_1.CardUtil.getColor(game.pickedCard)).toBe(card_1.CardColor.RED);
        game.action(game_1.Action.THROW_CARD, { userId });
        expect(anotherMock).toThrow(game_1.InvalidAction);
        expect(game.state).toBeInstanceOf(exchange_hand_with_other_1.ExchangeHandWithOther);
        game.action(game_1.Action.EXCHANGE_HAND_WITH_OTHER, { userId, cardId, otherPlayerId, otherCardId });
        game.setState(pile_picked_1.PilePicked.getInstance());
        game.pickedCard = new card_1.Card(card_1.CardSuit.CLUBS, card_1.CardRank.SEVEN);
        game.action(game_1.Action.THROW_CARD, { userId });
        expect(anotherMock).toThrow(game_1.InvalidAction);
        expect(game.state).toBeInstanceOf(show_one_hand_card_1.ShowOneHandCard);
        game.action(game_1.Action.SHOW_ONE_HAND_CARD, { userId, cardId: otherCardId });
        game.setState(pile_picked_1.PilePicked.getInstance());
        game.pickedCard = new card_1.Card(card_1.CardSuit.CLUBS, card_1.CardRank.TEN);
        game.burnAction = tempMock;
        game.action(game_1.Action.THROW_CARD, { userId });
        expect(anotherMock).toThrow(game_1.InvalidAction);
        expect(game.state).toBeInstanceOf(show_one_other_hand_card_1.ShowOneOtherHandCard);
        game.action(game_1.Action.SHOW_ONE_OTHER_HAND_CARD, { userId, otherPlayerId, otherCardId: cardId });
        expect(anotherMock).toThrow(game_1.InvalidAction);
        expect(game.state).toBeInstanceOf(pick_burn_1.PickBurn);
    });
    test('User 3 LEAVE', () => {
        const userId = usersId[2];
        const oldNumberOfPlayers = game.numberOfUserPlayers;
        const newNumberOfPlayers = oldNumberOfPlayers - 1;
        game.action(game_1.Action.LEAVE, { userId });
        expect(game.numberOfUserPlayers).toBe(newNumberOfPlayers);
        expect(game.isFull()).toBeFalsy();
    });
    test('User 2 LEAVE', () => {
        const userId = usersId[1];
        const oldNumberOfPlayers = game.numberOfUserPlayers;
        const newNumberOfPlayers = oldNumberOfPlayers - 1;
        game.action(game_1.Action.LEAVE, { userId });
        expect(game.numberOfUserPlayers).toBe(newNumberOfPlayers);
        expect(game.isFull()).toBeFalsy();
        expect(game.isEndOfGame()).toBeFalsy();
    });
    test('User 1 LEAVE', () => {
        const userId = usersId[0];
        const oldNumberOfPlayers = game.numberOfUserPlayers;
        const newNumberOfPlayers = oldNumberOfPlayers - 1;
        game.action(game_1.Action.LEAVE, { userId });
        expect(game.numberOfUserPlayers).toBe(newNumberOfPlayers);
        expect(game.isFull()).toBeFalsy();
        expect(game.isEndOfGame()).toBeTruthy();
    });
    test('Deck create invalid deck with negative size', () => {
        const mock = () => new deck_1.Deck(-1);
        expect(mock).toThrow(Error);
    });
});
//# sourceMappingURL=game.test.js.map