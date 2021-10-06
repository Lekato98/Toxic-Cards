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
    buildDeck(deckDiv, topBurnedCard);
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
    const isMine = player?.userId === userId;
    playerDiv.id = player?.id;

    cards.forEach((card) => {
        const cardDiv = document.createElement('div');
        card.isMine = isMine;
        card.playerId = player.id;
        cardDiv.classList.add('card');
        buildCard(cardDiv, card);
        playerDiv.append(cardDiv);
        cardEvent(cardDiv, card);
    });
}

function burnOneHandCardAction(card) {
    if (card.isMine) {
        emitAction(Action.BURN_ONE_HAND_CARD, {cardId: card?.id});
    }
}

function exchangePickWithHand(card) {
    if (card.isMine) {
        emitAction(Action.EXCHANGE_PICK_WITH_HAND, {cardId: card?.id});
    }
}

function showOneHandCard(card) {
    if (card.isMine) {
        emitAction(Action.SHOW_ONE_HAND_CARD, {cardId: card?.id});
    }
}

function showOneOtherHandCard(card) {
    if (!card.isMine) {
        emitAction(Action.SHOW_ONE_OTHER_HAND_CARD, {otherPlayerId: card.playerId, otherCardId: card?.id});
    }
}

function cardEvent(cardDiv, card) {
    switch (currentState) {
        case 'PickBurn':
            cardDiv.onclick = () => burnOneHandCardAction(card);
            break;

        case 'PilePicked':
        case 'BurnedPicked':
            cardDiv.onclick = () => exchangePickWithHand(card);
            break;

        case 'ShowOneHandCard':
            cardDiv.onclick = () => showOneHandCard(card);
            break;

        case 'ShowOneOtherHandCard':
            cardDiv.onclick = () => showOneOtherHandCard(card);
            break;

        case 'ExchangeHandWithOther':
    }
}

function buildCard(cardDiv, card) {
    cardDiv.id = card?.id;
    if (card?.suit) { // todo use isFaceUp later ....
        cardDiv.style.backgroundImage = `url(images/cards/${card.suit}/${card.rank}.png)`;
    }
}

function buildDeck(deckDiv, topBurnedCard) {
    const topBurnedCardDiv = document.createElement('div');
    const topPileCardDiv = document.createElement('div');

    topBurnedCardDiv.classList.add('card', 'burnt-card');
    topPileCardDiv.classList.add('card');

    topBurnedCardDiv.onclick = () => emitAction(Action.PICK_CARD_FROM_BURNED);
    topPileCardDiv.onclick = () => emitAction(Action.PICK_CARD_FROM_PILE);

    deckDiv.append(topBurnedCardDiv);
    deckDiv.append(topPileCardDiv);

    buildCard(topBurnedCardDiv, topBurnedCard);
    if (topBurnedCard?.id) {
        topBurnedCardDiv.classList.remove('burnt-card');
    } else {
        topBurnedCardDiv.classList.add('burnt-card');
    }
}

function buildGameBoard() {
    buildUpperContainer();
    buildMiddleContainer();
    buildBottomContainer();
}

void function bootstrap() {
    // buildGameBoard();
}();
