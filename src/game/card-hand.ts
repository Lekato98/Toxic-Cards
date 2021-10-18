import { Card } from './card';

export class CardHand {
    private readonly cards: Array<Card>;
    private readonly MAX_SIZE = 8;

    constructor() {
        this.cards = new Array<Card>();
    }

    public add(card: Card): void {
        card.markAsUsed();
        this.cards.push(card);
    }

    public remove(card: Card): void {
        const index = this.cards.findIndex((_card: Card) => _card === card);
        this.cards.splice(index, 1);
    }

    public getSize(): number {
        return this.cards.length;
    }

    public getCard(cardId: string): Card {
        return this.cards.find((_card: Card) => _card.id === cardId);
    }

    public clear(): void {
        this.cards.splice(0, this.getSize());
    }

    public getCardByOrder(order: number): Card {
        if (!this.isValidOrder(order)) {
            throw new Error('Invalid card order exceed the limit');
        }

        return this.cards[order];
    }

    public getState() {
        return {
            cards: this.cards.map((_card) => _card.getState()),
        };
    }

    public getWeightSum(): number {
        return this.cards.reduce((reducer: number, card: Card) => reducer + card.weight, 0);
    }

    public contains(cardId: string): boolean;
    public contains(card: Card): boolean;
    public contains(param: Card | string): boolean {
        return param instanceof Card ? this.cards.includes(param) : this.cards.some((card) => card.id === param);
    }

    public isValidOrder(order: number): boolean {
        return 0 <= order && order < this.getSize();
    }

    public isEmpty(): boolean {
        return this.getSize() === 0;
    }

    public isFull(): boolean {
        return this.getSize() === this.MAX_SIZE;
    }
}
