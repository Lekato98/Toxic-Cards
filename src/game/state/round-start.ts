import { Game, Action, InvalidAction } from "../game";
import { State } from "./state";

export class RoundStart implements State {
    action(context: Game, action: Action, payload?: any): void {
        switch(action) {
            case Action.START_ROUND:
                context.startRoundAction();

            default:
                throw new InvalidAction;
        }
    }
}