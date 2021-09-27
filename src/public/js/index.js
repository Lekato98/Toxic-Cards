const countdownNumberEl = document.getElementById('countdown-number');
const userId = ~~prompt('user id', '0');
const client = io('localhost:3000/game', {auth: {userId}});
const players = Array.from(document.getElementsByClassName('player'));

let countdown = 10;
let startTime = new Date();

countdownNumberEl.textContent = countdown;
countdownNumberEl.style.color = 'green';

function createGame() {
    client.emit('create_game', {numberOfPlayers: 3});
}

function joinGame() {
    const [gameId, playerId] = prompt('enter game_id, player_id', 'game_id,player_id').split(',');
    client.emit('join_game', {
        gameId: ~~gameId,
        playerId: playerId !== undefined ? ~~playerId: playerId,
    });
}

function joinQueue() {
    client.emit('join_queue');
}

function startGame() {
    client.emit('action', {action: 0});
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
players.forEach((_player, _index) => {
    console.log(_player.getElementsByTagName('span'));
})
client.on('success', console.log);
client.on('error', (message) => alert(message));
client.on('status', (payload) => alert(payload.message));
client.on('update_state', (state) => {
    console.log(state);
    players.forEach((_player, _index) => {
        const [span] = _player.getElementsByTagName('span');
        _player.id = state.players[_index]?.id ?? -1;
        span.innerText = state.players[_index]?.userId ?? 'Bot';
        const cards = Array.from(_player.getElementsByClassName('card'));
        cards.forEach((__card, __index) => {
            __card.id = state.players[_index]?.handCards[__index]?.id;
        })

    })
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
