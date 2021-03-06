import { Card } from './card';

export class CardStack {
    private readonly cards: Array<Card>;

    constructor() {
        this.cards = new Array<Card>();
    }

    public get top(): Card {
        return this.cards[this.getSize() - 1];
    }

    public getSize(): number {
        return this.cards.length;
    }

    public put(card: Card): void {
        this.cards.push(card);
    }

    public pick(): Card {
        return this.cards.pop();
    }

    public clear(): void {
        this.cards.splice(0, this.getSize());
    }

    public isEmpty(): boolean {
        return this.cards.length === 0;
    }
}
