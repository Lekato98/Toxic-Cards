import { Card, CardUtil } from './card';
import { Utils } from './utils';

export abstract class DeckUtil {
    public static createDeckOfCardsNTimes(n: number = 1): Array<Card> {
        const deckOfCards: Array<Card> = new Array<Card>();
        for (const suit of CardUtil.CARD_SUITS) {
            for (const rank of CardUtil.CARD_RANKS) {
                deckOfCards.push(new Card(suit, rank));
            }
        }

        return Array.from({length: n}, () => deckOfCards).flat();
    }
}

export class Deck {
    private readonly cards: Array<Card>;
    private readonly deckSize: number;
    private readonly MIN_NUMBER_OF_DECKS = 1;
    private readonly MAX_NUMBER_OF_DECKS = 4;

    constructor(deckSize: number = 1) {
        if (!this.isValidDeckSize(deckSize)) {
            throw new Error(`Deck size should be between(${ this.MIN_NUMBER_OF_DECKS }, ${ this.MAX_NUMBER_OF_DECKS })`);
        }

        this.cards = new Array<Card>();
        this.deckSize = deckSize;
        this.reset();
    }

    public reset(): void {
        const newSetOfCards = DeckUtil.createDeckOfCardsNTimes(this.deckSize);
        this.clear();
        this.cards.push(...newSetOfCards);
        this.resetCardsId();
    }

    public clear(): void {
        this.cards.splice(0, this.cards.length);
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

        this.resetCardsId();
    }

    public resetCardsId(): void {
        this.cards.forEach((card, index) => card.id = String(index + 1));
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

    public isValidDeckSize(numberOfDecks: number): boolean {
        return this.MIN_NUMBER_OF_DECKS <= numberOfDecks && numberOfDecks <= this.MAX_NUMBER_OF_DECKS;
    }

    public isEmpty(): boolean {
        return !this.cards.length;
    }
}
