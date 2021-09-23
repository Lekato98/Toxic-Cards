import { Game, Action, InvalidAction } from "../game";
import { State, UserActionPayload } from "./state";

interface BurendPickedPayload extends UserActionPayload {
    cardId: string;
}

export class BurendPicked implements State {
    action(context: Game, action: Action, payload?: BurendPickedPayload): void {
        switch(action) {
            case Action.EXCHANGE_PICK_WITH_HAND:
                context.exchangePickWithHandAction(payload.userId, payload.cardId);

            default:
                throw new InvalidAction;
        }
    }
    
}
