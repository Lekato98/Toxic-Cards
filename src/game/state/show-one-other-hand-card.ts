import { Game, Action } from "../game";
import { State, UserActionPayload } from "./state";

export class ShowOneOtherHandCard implements State {
    action(context: Game, action: Action, payload?: UserActionPayload): void {
        throw new Error("Method not implemented.");
    }
}