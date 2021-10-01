import { State, UserActionPayload } from './state';
import { Action, Game, InvalidAction } from '../game';

export class EndOfTurn implements State {
    private static instance: EndOfTurn;

    private constructor() {
    }

    public static getInstance(): EndOfTurn {
        if (!this.instance) {
            this.instance = new EndOfTurn();
        }

        return this.instance;
    }

    public action(context: Game, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_OF_TURN:
                return context.endOfTurnAction();

            default:
                throw new InvalidAction;
        }
    }
}
