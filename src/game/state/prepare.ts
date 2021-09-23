import { Action, Game, InvalidAction, UserAction } from "../game";
import { State } from "./state";

export class Prepare implements State {
    public readonly context: Game;

    constructor(context: Game) {
        this.context = context;
    }

    action(action: Action, payload?: UserAction): void {
        switch(action) {
            case Action.START_GAME: // go to next state
                this.context.startGameAction(payload.userId);
            
            default:
                throw new InvalidAction;
        }
    }
}