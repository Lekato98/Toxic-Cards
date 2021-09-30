const DEFAULT_CARD_URL = 'url(images/poker-cards.png)';
const countdownNumberEl = document.getElementById('countdown-number');
const userId = ~~prompt('user id', '0');
const client = io('127.0.0.1:3000/game', {auth: {userId}});
const players = Array.from(document.getElementsByClassName('player'));
const pileCards = document.getElementById('pile');
const burnedCards = document.getElementById('burned');

let countdown = 10;
let startTime = new Date();

const Action = Object.freeze({
    // CREATE_GAME,
    START_GAME: 0,
    JOIN_AS_PLAYER: 3,
    JOIN_AS_SPECTATOR: 4,
    PICK_CARD_FROM_PILE: 7,
    PICK_CARD_FROM_BURNED: 8,
    BURN_ONE_HAND_CARD: 9,
    BURN_CARD: 10,
    THROW_CARD: 11,
    USE_ABILITY: 12,
    EXCHANGE_PICK_WITH_HAND: 13,
    EXCHANGE_HAND_WITH_OTHER: 14,
    SHOW_ONE_HAND_CARD: 15,
    SHOW_ONE_OTHER_HAND_CARD: 16,
    PASS: 18,
    RESTART: 22,
    LEAVE: 23,
});

countdownNumberEl.textContent = countdown;
countdownNumberEl.style.color = 'green';

function createGame() {
    client.emit('create_game', {numberOfPlayers: 3});
}

function joinGame() {
    const [gameId, playerId] = prompt('enter game_id, player_id', 'game_id,player_id').split(',');
    client.emit('join_game', {
        gameId: ~~gameId,
        playerId: playerId !== undefined ? ~~playerId : playerId,
    });
}

function joinQueue() {
    client.emit('join_queue');
}

function leaveGame() {
    client.emit('leave_game');
}

function startGame() {
    client.emit('action', {action: 0});
}

function pickPile() {
    client.emit('action', {action: Action.PICK_CARD_FROM_PILE});
}

function pickBurned() {
    client.emit('action', {action: Action.PICK_CARD_FROM_BURNED});
}

function doAction() {
    const params = prompt('Action number,cardId,otherPlayerId,otherCardId', '0-22,xx,xx,xx').split(',');
    const action = ~~params[0];
    const cardId = params[1];
    const otherPlayerId = ~~params[2];
    const otherCardId = params[3];
    client.emit('action', {action, cardId, otherPlayerId, otherCardId});
}

function pingPong() {
    startTime = new Date();
    client.emit('ping');
}

function getRandomName() {
    const names = ['Bot abo el nw', 'Bot abo el 5er', 'Bot bulldozer', 'Bot abo el zomor'];
    const randomIndex = Math.floor(Math.random() * names.length);

    return names[randomIndex];
}

function getCardImageURL(card) {
    return `url(images/cards/${card.suit}/${card.rank}.png)`;
}

pileCards.addEventListener('click', pickPile);
burnedCards.addEventListener('click', pickBurned);
client.on('success', console.log);
client.on('error', (message) => alert(message));
client.on('status', (payload) => {
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
    } else if (payload.pickedCard) {
        const {pickedCard} = payload;
        // document.getElementById(`${pickedCard.id}`).style.backgroundImage = getCardImageURL(pickedCard);
        document.getElementById('pile').style.backgroundImage = getCardImageURL(pickedCard);
        setTimeout(() => {
            // document.getElementById(`${pickedCard.id}`).style.backgroundImage = DEFAULT_CARD_URL;
            document.getElementById('pile').style.backgroundImage = DEFAULT_CARD_URL;
        }, 5000);
    } else {
        alert(JSON.stringify(payload, null, 2));
    }
});
client.on('update_state', (state) => {
    console.log(state);
    document.getElementById('state').innerText = state.state;
    const topBurnedCard = state.topBurnedCards;
    document.getElementById('burned').style.backgroundImage = topBurnedCard.id ? getCardImageURL(topBurnedCard) : DEFAULT_CARD_URL;
    players.forEach((_player, _index) => {
        const [span] = _player.getElementsByTagName('span');
        const id = state.players[_index]?.id ?? -1;
        if (id !== -1) {
            _player.id = id;
        }

        _player.style.backgroundColor = id === state.turn ? 'lightslategray' : 'lightgray';
        span.innerText = state.players[_index]?.userId ?? getRandomName();
        const cards = Array.from(_player.getElementsByClassName('card'));
        cards.forEach((__card, __index) => {
            __card.id = state.players[_index]?.handCards?.cards[__index]?.id;
            // __card.style.backgroundImage = `url('images/cards/S/1.png')`;
        });
    });
});
client.on('pong', () => {
    const ping = new Date() - startTime;
    document.querySelector('#ping').innerText = `${ping}ms`;
    document.querySelector('#ping').style.color = ping < 60 ? 'green' : ping < 100 ? 'orange' : 'red';
});

pingPong();
setInterval(pingPong, 5000);
setInterval(() => {
    countdown = --countdown < 0 ? 10 : countdown;
    countdownNumberEl.textContent = countdown;
    countdownNumberEl.style.color = countdown < 4 ? 'red' : countdown < 7 ? 'orange' : 'green';
}, 1000);
