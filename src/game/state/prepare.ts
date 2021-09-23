import { Action, Game, InvalidAction } from "../game";
import { State, UserActionPayload } from "./state";

export class Prepare implements State {
    action(context: Game, action: Action, payload?: UserActionPayload): void {
        switch(action) {
            case Action.PREPARE_ROUND:
                context.prepareRoundAction();
            
            default:
                throw new InvalidAction;
        }
    }
}