import { State, UserActionPayload } from './state';
import { Action, Game, InvalidAction } from '../game';

export class BeginOfTurn implements State {
    private static instance: BeginOfTurn;

    private constructor() {}

    public static getInstance(): BeginOfTurn {
        if (!this.instance) {
            this.instance = new BeginOfTurn();
        }

        return this.instance;
    }

    public action(context: Game, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.BEGIN_OF_TURN:
                return context.beginOfTurnAction();

            default:
                throw new InvalidAction;
        }
    }
}
