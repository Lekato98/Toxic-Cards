import { Card } from './card';
import { CardHand } from './card-hand';
import { Utils } from './utils';
import { Event, GameSocketService } from '../socket/socket';

export class Player {
    public readonly id: number;
    public handCards: CardHand;
    private currentScore: number;
    private totalScore: number;
    public isBot: boolean;
    // if player reach -100 score or left the game
    // or if the game start and there is missing players
    public isOut: boolean;
    private userId: number;

    constructor(id: number, userId?: number) {
        this.id = id;
        this.handCards = new CardHand();
        this.isOut = false;
        this.resetCurrentScore();
        this.resetTotalScore();

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

        if (!this.isBot) {
            GameSocketService.emitUser(Event.STATUS, this.userId, {
                firstCard: cards[0].toShow(),
                secondCard: cards[1].toShow(),
            });
        }
    }

    public markAsBot(): void {
        this.userId = null;
        this.isBot = true;
    }

    public markAsUser(userId: number): void {
        this.userId = userId;
        this.isBot = false;
    }

    public getUserId(): number {
        return this.userId;
    }

    public markAsOut(): void {
        this.isOut = true;
    }

    public clearHand(): void {
        this.handCards.clear();
    }

    public resetCurrentScore(): void {
        this.currentScore = 0;
    }

    public resetTotalScore(): void {
        this.totalScore = 0;
    }

    public getCurrentScore(): number {
        return this.handCards.getWeightSum();
    }

    public getTotalScore(): number {
        return this.totalScore;
    }

    public updateTotalScore(isPositive: boolean = true): void {
        this.totalScore += isPositive ? this.currentScore : -this.currentScore;
        this.currentScore = 0;
    }

    public getState(): any {
        return {
            id: this.id,
            userId: this.userId,
            handCards: this.handCards.getState(),
            isBot: this.isBot,
            score: this.totalScore,
        };
    }
}
