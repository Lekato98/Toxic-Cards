import { Card, CardUtil } from './card';
import { Utils } from './utils';

export abstract class DeckUtil {
    public static createDeckOfCardsNTimes(n: number = 1): Array<Card> {
        const deckOfCards: Array<Card> = new Array<Card>();
        for (const suit of CardUtil.CARD_SUITS) {
            for (const rank of CardUtil.CARD_RANKS) {
                const newCard = new Card(suit, rank);
                deckOfCards.push(newCard);
            }
        }

        return Array.from({length: n}, () => deckOfCards).flat();
    }
}

export class Deck {
    private readonly cards: Array<Card>;
    private readonly numberOfDecks: number;
    private readonly MAX_NUMBER_OF_DECKS = 3;
    private readonly MIN_NUMBER_OF_DECKS = 1;

    constructor(numberOfDecks: number = 1) {
        if (!this.isValidNumberOfDecks(numberOfDecks)) {
            throw new Error('Number of decks exceed the limit');
        }

        this.cards = new Array<Card>();
        this.numberOfDecks = numberOfDecks;
        this.reset();
    }

    public reset(): void {
        const newSetOfCards = DeckUtil.createDeckOfCardsNTimes(this.numberOfDecks);
        this.cards.splice(0, this.getSize());
        this.cards.push(...newSetOfCards);
    }

    /**
     * Fisher Yates Algorithm for shuffle
     * @todo move to utils class
     */
    public shuffle(): void {
        let currentIndex = this.getSize();
        let randomIndex: number;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {

            // Pick a remaining element...
            randomIndex = Utils.randomInteger(currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [this.cards[currentIndex], this.cards[randomIndex]] = [
                this.cards[randomIndex], this.cards[currentIndex]];
        }
    }

    /**
     * return size of cards
     * @returns
     */
    public getSize(): number {
        return this.cards.length;
    }

    public pop(): Card {
        return this.cards.pop();
    }

    public isValidNumberOfDecks(numberOfDecks: number): boolean {
        return this.MIN_NUMBER_OF_DECKS <= numberOfDecks && numberOfDecks <= this.MAX_NUMBER_OF_DECKS;
    }

    public isEmpty(): boolean {
        return !this.cards.length;
    }
}
