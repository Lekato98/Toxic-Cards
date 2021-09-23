import { Card } from "./card";

export class CardStack {
    private cards: Array<Card>;

    constructor() {
        this.cards = new Array<Card>();
    }

    /**
     * getSize
     */
    public getSize(): number {
        return this.cards.length;
    }

    /**
     * add
     */
    public put(card: Card): void {
        this.cards.push(card);
    }

    /**
     * pick
     */
    public pick(): Card {
        return this.cards.pop();
    }

    public get top(): Card {
        return this.cards[this.getSize() - 1];
    }
}