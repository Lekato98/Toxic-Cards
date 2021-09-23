import { Game, Action, InvalidAction } from "../game";
import { State, UserActionPayload } from "./state";

interface PilePickedPayload extends UserActionPayload {
    cardId?: string;
}

export class PilePicked implements State {
    action(context: Game, action: Action, payload?: PilePickedPayload): void {
        switch(action) {
            case Action.THROW_CARD:
                context.useAbilityAction();

            case Action.EXCHANGE_PICK_WITH_HAND:
                context.exchangePickWithHandAction(payload?.userId, payload?.cardId);

            default:
                throw new InvalidAction;
        }
    }
}