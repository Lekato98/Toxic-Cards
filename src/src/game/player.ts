import { Card } from "./card";
import { CardHand } from "./card-hand";
import { User } from "./user";

export class Player {
    private user: User;
    public handCards: CardHand;
    public score: number;

    constructor(user: User) {
        this.user = user;
        this.score = 0;
    }

    public setHandCards(handCards: CardHand): void {
        this.handCards = handCards;
    }

    public isOwner(userId: number): boolean {
        return this.user.getId() === userId;
    }

    public isCardOwner(card: Card): boolean {
        return this.handCards.contains(card);
    }

    public getCard(cardId:string): Card {
        return this.handCards.getCard(cardId);
    }
}