import { Card } from './card';
import { CardHand } from './card-hand';
import { User } from './user';

export class Player {
    public readonly id: number;
    public handCards: CardHand;
    public score: number;
    private user: User;

    constructor(id: number, user?: User) {
        this.id = id;
        this.user = user;
        this.score = 0;
        this.handCards = new CardHand();
    }

    public addCardToHand(card: Card): void {
        this.handCards.add(card);
    }

    public isOwner(userId: number): boolean {
        return this.user.getId() === userId;
    }

    public isCardOwner(card: Card): boolean {
        return this.handCards.contains(card);
    }

    public getCard(cardId: string): Card {
        return this.handCards.getCard(cardId);
    }

    public emitTwoCards(): void {
        const firstCard = 0;
        const secondCard = 1;
        const cards = [
            this.handCards.getCardByOrder(firstCard),
            this.handCards.getCardByOrder(secondCard),
        ];

        // @TODO add event
        this.user?.emit('', cards);
    }

    public clearHand(): void {
        this.handCards.clear();
    }
}
