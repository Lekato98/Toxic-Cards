import { Action, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface ExchangeHandWithOtherActionPayload extends UserActionPayload {
    cardId: string;
    otherPlayerId: number;
    otherCardId: string;
}

export class ExchangeHandWithOther implements State {
    private static instance: ExchangeHandWithOther;

    private constructor() {
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
