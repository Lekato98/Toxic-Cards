const upperContainer = document.querySelector('.upper-container'); // 1 player
const middleContainer = document.querySelector('.middle-container'); // 2 players + deck
const bottomContainer = document.querySelector('.bottom-container'); // 1 player - main-player

function buildUpperContainer(player) {
    upperContainer.innerHTML = '';
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('player');
    buildPlayer(playerDiv, player);
    upperContainer.append(playerDiv);
}

function buildMiddleContainer([leftPlayer, rightPlayer] = [], topBurnedCard) {
    middleContainer.innerHTML = '';
    const leftPlayerDiv = document.createElement('div');
    const rightPlayerDiv = document.createElement('div');
    const deckDiv = document.createElement('div');

    leftPlayerDiv.classList.add('player', 'rotated-90-deg', 'horizontal-player');
    deckDiv.classList.add('deck');
    rightPlayerDiv.classList.add('player', 'rotated-90-deg', 'horizontal-player');

    buildPlayer(leftPlayerDiv, leftPlayer);
    buildDeck(deckDiv);
    buildPlayer(rightPlayerDiv, rightPlayer);

    middleContainer.append(leftPlayerDiv);
    middleContainer.append(deckDiv);
    middleContainer.append(rightPlayerDiv);
}

function buildBottomContainer(player) {
    bottomContainer.innerHTML = '';
    const mainPlayerDiv = document.createElement('div');
    mainPlayerDiv.classList.add('player', 'main-player-POV');
    buildPlayer(mainPlayerDiv, player);
    bottomContainer.append(mainPlayerDiv);
}

function buildPlayer(playerDiv, player) {
    const cards = player?.handCards?.cards ?? [];
    playerDiv.id = player?.id;

    cards.forEach((card) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        buildCard(cardDiv, card);
        playerDiv.append(cardDiv);
    });
}

function buildCard(cardDiv, card) {
    cardDiv.id = card?.id;
    if (card.suit) { // todo use isFaceUp later ....
        cardDiv.style.backgroundImage = `url(images/cards/${card.suit}/${card.rank}.png)`;
    }
}

function buildDeck(deckDiv) {
    const topBurnedCardDiv = document.createElement('div');
    const topPileCardDiv = document.createElement('div');

    topBurnedCardDiv.classList.add('card', 'burnt-card');
    topPileCardDiv.classList.add('card');

    deckDiv.append(topBurnedCardDiv);
    deckDiv.append(topPileCardDiv);
}

function buildGameBoard() {
    buildUpperContainer();
    buildMiddleContainer();
    buildBottomContainer();
}

void function bootstrap() {
    // buildGameBoard();
}();
