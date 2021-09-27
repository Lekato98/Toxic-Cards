import { Card } from './card';
import { CardHand } from './card-hand';
import { Utils } from './utils';

export class Player {
    public readonly id: number;
    public handCards: CardHand;
    public score: number;
    public isBot: boolean;
    private userId: number;

    constructor(id: number, userId?: number) {
        this.id = id;
        this.score = 0;
        this.handCards = new CardHand();

        if (!Utils.isNullOrUndefined(userId)) {
            this.markAsUser(userId);
        } else {
            this.markAsBot();
        }
    }

    public addCardToHand(card: Card): void {
        this.handCards.add(card);
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
        // this.user?.emit('', cards);
    }

    public markAsBot(): void {
        this.userId = null;
        this.isBot = true;
    }

    public markAsUser(userId: number): void {
        this.userId = userId;
        this.isBot = false;
    }

    public clearHand(): void {
        this.handCards.clear();
    }

    public getState(): any {
        return {
            id: this.id,
            userid: this.userId,
            handCards: this.handCards.getState(),
            isBot: this.isBot,
        };
    }
}
