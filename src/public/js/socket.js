const DEFAULT_CARD_URL = 'url(images/poker-cards.png)';
const userId = Math.floor(Math.random() * 1000);
const gameClient = io(`${ENDPOINT}/game`, {auth: {userId}});
const createGameBtn = document.querySelector('#create-game');
const joinGameBtn = document.querySelector('#join-game');
const joinQueueBtn = document.querySelector('#join-queue');
const startGameBtn = document.querySelector('#start-game');

const Action = Object.freeze({
    // CREATE_GAME,
    START_GAME: 0,
    JOIN_AS_PLAYER: 3,
    JOIN_AS_SPECTATOR: 4, // nvm
    PICK_CARD_FROM_PILE: 7,
    PICK_CARD_FROM_BURNED: 8,
    BURN_ONE_HAND_CARD: 9,
    THROW_CARD: 11,
    EXCHANGE_PICK_WITH_HAND: 13,
    EXCHANGE_HAND_WITH_OTHER: 14,
    SHOW_ONE_HAND_CARD: 15,
    SHOW_ONE_OTHER_HAND_CARD: 16,
    PASS: 18,
    RESTART: 22, // ~todo
    LEAVE: 23,
});

const Event = Object.freeze({
    CONNECTION: 'connection',
    PING: 'ping',
    PONG: 'pong',
    STATUS: 'status',
    SUCCESS: 'success',
    CREATE_GAME: 'create_game',
    JOIN_GAME: 'join_game',
    JOIN_QUEUE: 'join_queue',
    ACTION: 'action',
    LEAVE_GAME: 'leave_game',
    UPDATE_STATE: 'update_state',
    RECONNECT: 'reconnect',
    ERROR: 'error',
    DISCONNECT: 'disconnect',
});

function emitAction(action, payload = {}) {
    gameClient.emit(Event.ACTION, {...payload, action});
}

function createGame() {
    gameClient.emit(Event.CREATE_GAME);
}

function joinQueue() {
    gameClient.emit(Event.JOIN_QUEUE);
}

function joinGame() {
    const gameId = 0; // fill
    const playerId = 0; // fill
    gameClient.emit(Event.JOIN_GAME, {gameId, playerId});
}

function startGame() {
    emitAction(Action.START_GAME);
}

function getPositionWithOffset(startPosition, offset, size) {
    return (startPosition + offset) % size;
}

function updateState(state) {
    const {
        players,
        topBurnedCard,
        passedBy,
        state: stateName,
    } = state ?? {};
    // rerender the whole game board
    const myPosition = players.findIndex((player) => player.userId === userId);
    buildUpperContainer(players[getPositionWithOffset(myPosition, 2, players.length)]);
    buildMiddleContainer([
        players[getPositionWithOffset(myPosition, 3, players.length)],
        players[getPositionWithOffset(myPosition, 1, players.length)],
    ], topBurnedCard);
    buildBottomContainer(players[getPositionWithOffset(myPosition, 0, players.length)]);
}

function getCardImageURL(card) {
    return card.suit ? `url(images/cards/${card.suit}/${card.rank}.png)` : DEFAULT_CARD_URL;
}


gameClient.on(Event.UPDATE_STATE, updateState);
gameClient.on(Event.STATUS, (payload) => {
    if (payload.firstCard) {
        setTimeout(() => {
            const {firstCard, secondCard} = payload;
            document.getElementById(`${firstCard.id}`).style.backgroundImage = getCardImageURL(firstCard);
            document.getElementById(`${secondCard.id}`).style.backgroundImage = getCardImageURL(secondCard);
            setTimeout(() => {
                document.getElementById(`${firstCard.id}`).style.backgroundImage = DEFAULT_CARD_URL;
                document.getElementById(`${secondCard.id}`).style.backgroundImage = DEFAULT_CARD_URL;
            }, 5000);
        }, 1000);
    } else {
        alert(JSON.stringify(payload, null, 2));
    }
});

