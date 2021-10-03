const DEFAULT_CARD_URL = 'url(images/poker-cards.png)';
const countdownNumberEl = document.getElementById('countdown-number');
const userId = Math.floor(Math.random() * 1000); // ~~prompt('user id', '0')
const client = io('localhost:3000/game', {auth: {userId}});
const players = Array.from(document.getElementsByClassName('player'));
const pileCards = document.getElementById('pile');
const burnedCards = document.getElementById('burned');
const pickedDeck = document.getElementsByClassName('picked-deck')[0];
const pickedCardHolder = pickedDeck.getElementsByClassName('card')[0];

let isMy = false;
let countdown = 10;
let startTime = new Date();
let myPick = null;
let otherPick = null;

const Action = Object.freeze({
    // CREATE_GAME,
    START_GAME: 0, // done
    JOIN_AS_PLAYER: 3, // done
    JOIN_AS_SPECTATOR: 4, // nvm
    PICK_CARD_FROM_PILE: 7, // done
    PICK_CARD_FROM_BURNED: 8, // done
    BURN_ONE_HAND_CARD: 9, // done
    THROW_CARD: 11, // done
    EXCHANGE_PICK_WITH_HAND: 13, // done
    EXCHANGE_HAND_WITH_OTHER: 14,
    SHOW_ONE_HAND_CARD: 15,
    SHOW_ONE_OTHER_HAND_CARD: 16,
    PASS: 18,
    RESTART: 22,
    LEAVE: 23, // done
});

countdownNumberEl.textContent = countdown;
countdownNumberEl.style.color = 'green';

function createGame() {
    client.emit('create_game', {numberOfPlayers: 4});
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
    client.emit('action', {action: Action.START_GAME});
}

function passAction() {
    client.emit('action', {action: Action.PASS});
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

function burnOneHandCard() {
    const cardId = this.id;
    client.emit('action', {action: Action.BURN_ONE_HAND_CARD, cardId});
}

function throwPickedCard() {
    client.emit('action', {action: Action.THROW_CARD});
}

function exchangePickWithHand() {
    const cardId = this.id;
    client.emit('action', {action: Action.EXCHANGE_PICK_WITH_HAND, cardId});
}

function showOneHandCard() {
    const cardId = this.id;
    client.emit('action', {action: Action.SHOW_ONE_HAND_CARD, cardId});
}

function showOneOtherHandCard(otherPlayerId, otherCardId) {
    client.emit('action', {action: Action.SHOW_ONE_OTHER_HAND_CARD, otherCardId, otherPlayerId});
}

function swapAction() {
    if (myPick && otherPick) {
        document.getElementById(myPick).classList.remove('selected');
        document.getElementById(otherPick.otherCardId).classList.remove('selected');
        client.emit('action', {action: Action.EXCHANGE_HAND_WITH_OTHER, cardId: myPick, ...otherPick});
    }
}

function exchangeOneHandCardWithOther(event) {
    // @todo
    const [myPlayer] = [...players];
    const otherPlayers = [...players];
    otherPlayers.splice(0, 1);

    const myCards = Array.from(myPlayer.getElementsByClassName('card'));
    myCards.forEach((card) => {
        card.onclick = () => {
            myCards.forEach((_card) => _card.classList.remove('selected'));
            card.classList.add('selected');
            myPick = card.id;
        };
    });

    const otherCards = otherPlayers.map((player) => Array.from(player.getElementsByClassName('card'))).flat();
    otherCards.forEach((card) => {
        card.onclick = () => {
            otherCards.forEach((_card) => _card.classList.remove('selected'));
            card.classList.add('selected');
            otherPick = {
                otherPlayerId: +card.parentElement.id,
                otherCardId: card.id,
            };
        };
    });
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

function setOtherAction() {
    players.forEach((player) => {
        const cards = Array.from(player.getElementsByClassName('card'));
        cards.forEach((card) => {
            card.onclick = () => showOneOtherHandCard(+player.id, card.id);
        });
    });
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
        pickedCardHolder.style.backgroundImage = getCardImageURL(pickedCard);
        pickedDeck.id = pickedCardHolder.id;
        pickedDeck.style.display = 'block';
    } else {
        alert(JSON.stringify(payload, null, 2));
    }
});
client.on('update_state', (state) => {
    console.log(state);
    const myPosition = state.players.findIndex((_player) => _player.userId === userId);
    const myPlayer = state.players[myPosition];
    const cards = [];
    myPlayer.handCards?.cards?.forEach(card => cards.push(document.getElementById(String(card.id))));

    document.getElementById('state').innerText = state.state;
    const topBurnedCard = state.topBurnedCards;
    document.getElementById('burned').style.backgroundImage = topBurnedCard.id ? getCardImageURL(topBurnedCard) : DEFAULT_CARD_URL;
    const numberOfPlayers = state.players.length;
    let currentPosition = myPosition === -1 ? 0 : myPosition;
    let index = 0;

    if (myPlayer.userId === state.players[state.turn]?.userId) {
        isMy = true;
    } else {
        pickedDeck.style.display = 'none';
    }

    do {
        const _player = players[index];
        const [span] = _player.getElementsByTagName('span');
        const [score] = _player.getElementsByClassName('score');
        const id = state.players[currentPosition].id;
        if (id !== -1) {
            _player.id = id;
        }

        const isMyTurn = id === state.turn;
        _player.style.backgroundColor = isMyTurn ? 'lightslategray' : '';

        const curPlayer = state.players[currentPosition];
        span.innerText = `User#${curPlayer.userId ?? -1}:${curPlayer.username ?? getRandomName()}`;
        score.innerText = `Score: ${curPlayer.score}`;
        const cards = Array.from(_player.getElementsByClassName('card'));
        cards.forEach((__card, __index) => {
            const cardId = state.players[currentPosition]?.handCards?.cards[__index]?.id;
            if (cardId) {
                __card.id = cardId;
                __card.style.display = 'inline-block';
            } else {
                __card.style.display = 'none';
            }
        });

        if (id === state.passedBy) {
            _player.style.backgroundColor = 'lightseagreen';
        }

        if (curPlayer.isOut) {
            _player.style.backgroundColor = 'darkred';
        }

        currentPosition = (currentPosition + 1) % numberOfPlayers;
        ++index;
    } while (currentPosition !== myPosition);

    switch (state.state) {
        case 'PickBurn':
            cards.forEach((card) => card.onclick = burnOneHandCard);
            break;

        case 'ShowOneHandCard':
            cards.forEach((card) => card.onclick = showOneHandCard);
            break;

        case 'ShowOneOtherHandCard':
            setOtherAction();
            break;

        case 'ExchangeHandWithOther':
            exchangeOneHandCardWithOther();
            break;

        case 'PilePicked':
            cards.forEach((card) => card.onclick = exchangePickWithHand);
            pickedCardHolder.onclick = throwPickedCard;
            break;

        case 'BurnedPicked':
            cards.forEach((card) => card.onclick = exchangePickWithHand);
            break;
    }
});
client.on('pong', () => {
    const ping = new Date() - startTime;
    document.querySelector('#ping').innerText = `${ping}ms`;
    document.querySelector('#ping').style.color = ping < 90 ? 'green' : ping < 150 ? 'orange' : 'red';
});

pingPong();
setInterval(pingPong, 5000);
setInterval(() => {
    countdown = --countdown < 0 ? 10 : countdown;
    countdownNumberEl.textContent = countdown;
    countdownNumberEl.style.color = countdown < 4 ? 'red' : countdown < 7 ? 'orange' : 'green';
}, 1000);
