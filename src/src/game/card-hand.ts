import { Card } from "./card";

export class CardHand {
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

    public add(card: Card): void {
        card.markAsUsed();
        this.cards.push(card);
    }

    public remove(card: Card): void {
        this.cards = this.cards.filter((_card: Card) => _card === card);
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
}