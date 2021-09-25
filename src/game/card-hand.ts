import { Card } from './card';

export class CardHand {
    private readonly cards: Array<Card>;

    constructor() {
        this.cards = new Array<Card>();
    }

    /**
     * getSize
     */
    public getSize(): number {
        return this.cards.length;
    }

    public add(card: Card): void {
        card.markAsUsed();
        this.cards.push(card);
    }

    public remove(card: Card): void {
        const index = this.cards.findIndex((_card: Card) => _card === card);
        this.cards.splice(index, 1);
    }

    public getCard(cardId: string): Card {
        return this.cards.find((_card: Card) => _card.id === cardId);
    }

    public contains(card: Card): boolean {
        return this.cards.some((_card: Card) => _card === card);
    }

    public hsaCard(cardId: string): boolean {
        return this.cards.some((_card: Card) => _card.id === cardId);
    }

    public getCardByOrder(order: number) {
        if (!this.isValidOrder(order)) {
            throw new Error('Invalid card order exceed the limit');
        }

        return this.cards[order];
    }

    public clear(): void {
        this.cards.splice(0, this.getSize());
    }

    public isValidOrder(order: number): boolean {
        return 0 <= order && order < this.getSize();
    }

    public isEmpty(): boolean {
        return this.getSize() === 0;
    }
}
