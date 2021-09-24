import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

interface ExchangeHandWithOtherActionPayload extends UserActionPayload {
    cardId: string;
    otherPlayerId: number;
    otherCardId: string;
}

export class ExchangeHandWithOther implements State {
    action(context: Game, action: Action, payload?: ExchangeHandWithOtherActionPayload): void {
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
