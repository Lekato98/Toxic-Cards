import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

interface BurnedPickedPayload extends UserActionPayload {
    cardId: string;
}

export class BurnedPicked implements State {
    action(context: Game, action: Action, payload?: BurnedPickedPayload): void {
        switch (action) {
            case Action.EXCHANGE_PICK_WITH_HAND:
                return context.exchangePickWithHandAction(payload.userId, payload.cardId);

            default:
                throw new InvalidAction;
        }
    }

}
