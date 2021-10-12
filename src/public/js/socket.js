const DEFAULT_CARD_URL = 'url(images/poker-cards.png)';
const userId = Math.floor(Math.random() * 1000);
const gameClient = io(`${ENDPOINT}/game`, {auth: {userId}});
const pingDiv = document.querySelector('#ping');
const createGameBtn = document.querySelector('#create-game');
const joinGameBtn = document.querySelector('#join-game');
const joinQueueBtn = document.querySelector('#join-queue');
const startGameBtn = document.querySelector('#start-game');
let currentState = '';
let pickedCard = null;
let startTime = new Date();

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
    console.log(state);
    const {
        players,
        topBurnedCards: topBurnedCard,
        passedBy,
        turn,
        state: stateName,
    } = state ?? {};
    if (stateName !== 'PilePicked' || stateName !== 'BurnPicked') {
        const [pickedCardDiv] = document.getElementsByClassName('pulled-card');
        if (pickedCardDiv) {
            pickedCardDiv.style.display = 'none';
            pickedCard = null;
        }
    }

    // rerender the whole game board
    currentState = stateName;
    const myPosition = players.findIndex((player) => player.userId === userId);

    players.forEach((player, index) => {
        player.isTurn = index === turn;
        player.isPassedBy = index === passedBy;
    });

    buildUpperContainer(players[getPositionWithOffset(myPosition, 2, players.length)]);
    buildMiddleContainer([
        players[getPositionWithOffset(myPosition, 3, players.length)],
        players[getPositionWithOffset(myPosition, 1, players.length)],
    ], topBurnedCard, pickedCard);
    buildBottomContainer(players[getPositionWithOffset(myPosition, 0, players.length)]);
}

function getCardImageURL(card) {
    return card.suit ? `url(images/cards/${card.suit}/${card.rank}.png)` : DEFAULT_CARD_URL;
}

function action() {
    const [action, cardId, otherPlayerId, otherCardId] = (prompt('action,cardId,otherPlayerId,otherCardId', '0-22,xxx,xxx,xxx') || '').split(',');
    emitAction(~~action, {cardId, otherPlayerId, otherCardId});
}

function errorHandler(payload) {
    alert(JSON.stringify(payload, null, 2));
}

function pingEvent() {
    startTime = new Date();
    gameClient.emit(Event.PING);
    setTimeout(pingEvent, 1000);
}

function pongHandler() {
    const endTime = new Date();
    const ping = endTime - startTime;
    pingDiv.innerText = `${ping}ms`;
    pingDiv.style.color = (ping < 80 ? 'green' : ping < 120 ? 'orange' : 'red');
}

gameClient.on(Event.UPDATE_STATE, updateState);
gameClient.on(Event.ERROR, errorHandler);
gameClient.on(Event.PONG, pongHandler);
gameClient.on(Event.STATUS, (payload) => {
    if (payload.firstCard) {
        setTimeout(() => {
            const {firstCard, secondCard} = payload;
            const firstCardDiv = document.getElementById(`${firstCard.id}`);
            const secondCardDiv = document.getElementById(`${secondCard.id}`);
            firstCardDiv.style.backgroundImage = getCardImageURL(firstCard);
            secondCardDiv.style.backgroundImage = getCardImageURL(secondCard);
            setTimeout(() => {
                firstCardDiv.style.backgroundImage = DEFAULT_CARD_URL;
                secondCardDiv.style.backgroundImage = DEFAULT_CARD_URL;
            }, 5000);
        }, 1000);
    } else if (payload.pickedCard) {
        pickedCard = payload.pickedCard;
    } else {
        alert(JSON.stringify(payload, null, 2));
    }
});

pingEvent();
