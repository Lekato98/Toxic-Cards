import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

interface ShowOneOtherHandCardActionPayload extends UserActionPayload {
    otherPlayerId;
    otherCardId;
}

export class ShowOneOtherHandCard implements State {
    action(context: Game, action: Action, payload?: ShowOneOtherHandCardActionPayload): void {
        switch (action) {
            case Action.SHOW_ONE_OTHER_HAND_CARD:
                return context.showOneOtherHandCardAction(payload.userId, payload.otherPlayerId, payload.otherCardId);

            default:
                throw new InvalidAction;
        }
    }
}
