import { Card, CardUtil } from './card';

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
    private cards: Array<Card>;
    private readonly numberOfDecks: number;
    private readonly MAX_NUMBER_OF_DECKS = 3;
    private readonly MIN_NUMBER_OF_DECKS = 1;

    constructor(numberOfDecks: number = 1) {
        if (!this.isValidNumberOfDecks(numberOfDecks)) {
            throw new Error('Number of decks exceed the limit');
        }

        this.numberOfDecks = numberOfDecks;
        this.reset();
    }

    public reset(): void {
        this.cards = DeckUtil.createDeckOfCardsNTimes(this.numberOfDecks);
    }

    /**
     * Fisher Yate Algorithm for shuffle
     */
    public shuffle(): void {
        let currentIndex = this.getSize();
        let randomIndex: number;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
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

    public getCards(): Array<Card> {
        return this.cards;
    }

    public isValidNumberOfDecks(numberOfDecks: number): boolean {
        return numberOfDecks <= this.MAX_NUMBER_OF_DECKS || numberOfDecks > this.MIN_NUMBER_OF_DECKS;
    }

    public isEmpty(): boolean {
        return !this.cards.length;
    }
}
