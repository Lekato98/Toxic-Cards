import { State, UserActionPayload } from './state';
import { Action, InvalidAction } from '../game';
import { GameAction } from '../game-action';

export class BeginOfTurn implements State {
    private static instance: BeginOfTurn;

    private constructor() {
    }

    public static getInstance(): BeginOfTurn {
        if (!this.instance) {
            this.instance = new BeginOfTurn();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.BEGIN_OF_TURN:
                return context.beginOfTurnAction();

            default:
                throw new InvalidAction;
        }
    }
}
