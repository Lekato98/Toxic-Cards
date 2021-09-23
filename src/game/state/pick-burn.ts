import { Game, Action, InvalidAction } from "../game";
import { State, UserActionPayload } from "./state";

interface PickBurnPayload extends UserActionPayload {
    cardId: string;
}

export class PickBurn implements State {
    action(context: Game, action: Action, payload?: PickBurnPayload): void {
        switch(action) {
            case Action.PICK_CARD_FROM_PILE:
                context.pickCardFromPileAction();
                
            case Action.PICK_CARD_FROM_BURNED:
                context.pickCardFromBurnedAction();

            case Action.BURN_ONE_HAND_CARD:
                context.burnOneHandCardAction(payload?.userId, payload?.cardId);

            default:
                throw new InvalidAction;
        }
    }
}