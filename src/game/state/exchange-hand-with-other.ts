import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface ExchangeHandWithOtherActionPayload extends UserActionPayload {
    cardId: string;
    otherPlayerId: number;
    otherCardId: string;
}

export class ExchangeHandWithOther implements State {
    private static instance: ExchangeHandWithOther;
    public timeMs: number;

    private constructor() {
        this.timeMs = 5000;
    }

    public afkAction(context: Game) {
        const player = context.getCurrentPlayer();
        const userId = player.getUserId();
        const card = player.getRandomCard();
        const cardId = card.id;
        const otherPlayer = context.getRandomPlayerButNotCurrent();
        const otherPlayerId = otherPlayer.id;
        const otherCard = otherPlayer.getRandomCard();
        const otherCardId = otherCard.id;
        context.doAction(Action.EXCHANGE_PICK_WITH_HAND, {
            userId,
            cardId,
            otherPlayerId,
            otherCardId,
        });
    }

    public static getInstance(): ExchangeHandWithOther {
        if (!this.instance) {
            this.instance = new ExchangeHandWithOther();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: ExchangeHandWithOtherActionPayload): void {
        switch (action) {
            case Action.EXCHANGE_HAND_WITH_OTHER:
                return context.exchangeHandWithOther(
                    payload.userId,
                    payload.cardId,
                    payload.otherPlayerId,
                    payload.otherCardId,
                );

            default:
                throw new InvalidAction;
        }
    }

}
