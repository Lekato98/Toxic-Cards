import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

interface ShowOneHandCardActionPayload extends UserActionPayload {
    cardId: string;
}

export class ShowOneHandCard implements State {
    // @todo remove any
    action(context: Game, action: Action, payload?: ShowOneHandCardActionPayload): void | any {
        switch (action) {
            case Action.SHOW_ONE_HAND_CARD:
                return context.showOneHandCardAction(payload.userId, payload.cardId);

            default:
                throw new InvalidAction;
        }
    }
}
