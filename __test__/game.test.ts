import { Action, Game } from '../src/game/game';
import { StartGame } from '../src/game/state/start-game';
import { RoundStart } from '../src/game/state/round-start';
import { DeckUtil } from '../src/game/deck';
import { PickBurn } from '../src/game/state/pick-burn';

describe('Test Game', () => {
    const usersId = [1, 2, 3];
    let game: Game;

    test('Create Game With 3 players', () => {
        const maxNumberOfPlayers = 3;
        const initialState = new StartGame;
        game = new Game(maxNumberOfPlayers, initialState);
        expect(game.burnedCards.isEmpty()).toBe(true);
        expect(game.burnedCards.getSize()).toBe(0);
        expect(game.isGameStarted).toBe(false);
        expect(game.isFull()).toBe(false);
        expect(game.numberOfPlayers).toBe(0);
        expect(game.leader).toBeNull();
        expect(game.passedBy).toBeNull();
        expect(game.players.length).toBe(maxNumberOfPlayers);

        const cards = game.deck.getCards();
        const compareCards = DeckUtil.createDeckOfCardsNTimes(1);

        expect(cards.length).toEqual(compareCards.length);
        expect(cards.every((_card, _index) => _card.equalsRankAndSuit(compareCards[_index]))).toBeTruthy();
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

    test('User 3 JOIN_AS_PLAYER', () => {
        const userId = usersId[2];
        game.action(Action.JOIN_AS_PLAYER, {userId: userId, playerId: 2});
        expect(game.leader).toBe(usersId[0]);
        expect(game.isGameStarted).toBeFalsy();
        expect(game.numberOfPlayers).toBe(3);
        expect(game.isLeaderUser(userId)).toBeFalsy();
        expect(game.isJoinedAsPlayer(userId)).toBeTruthy();
        expect(game.isFull()).toBeTruthy();
    });

    test('Leader User START_GAME', () => {
        const userId = usersId[0];
        // temporary mock this function
        const tempMock = game.startRoundAction;
        game.startRoundAction = () => {};
        expect(game.state).toBeInstanceOf(StartGame);
        game.action(Action.START_GAME, {userId: userId});
        expect(game.isGameStarted).toBe(true);
        expect(game.state).toBeInstanceOf(RoundStart);
        expect(game.turn).toBeDefined();
        expect(usersId.includes(game.turn)).toBeTruthy();

        const cards = game.deck.getCards();
        const compareCards = DeckUtil.createDeckOfCardsNTimes();

        expect(cards.length).toEqual(compareCards.length);
        expect(cards.every((_card, _index) => _card.equalsRankAndSuit(compareCards[_index]))).toBeFalsy();

        // reset mocked function
        game.startRoundAction = tempMock;
    });

    test('Internal Call START_ROUND', () => {
        const randomPlayer = game.players[0];
        const numberOfCardsInNormalSet = 52;
        expect(randomPlayer.handCards.isEmpty()).toBeTruthy();
        game.action(Action.START_ROUND);
        expect(game.pileOfCards.getSize()).toBe(numberOfCardsInNormalSet - usersId.length * game.DEFAULT_NUMBER_OF_CARDS_PER_HAND);
        expect(randomPlayer.handCards.getSize()).toBe(game.DEFAULT_NUMBER_OF_CARDS_PER_HAND);
        expect(game.state).toBeInstanceOf(PickBurn);
    });
});
