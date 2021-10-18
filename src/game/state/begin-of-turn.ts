import { State, UserActionPayload } from './state';
import { Action, Game, InvalidAction } from '../game';
import { GameAction } from '../game-action';

export class BeginOfTurn implements State {
    private static instance: BeginOfTurn;
    public timeMs: number;

    private constructor() {
        this.timeMs = 0;
    }

    public static getInstance(): BeginOfTurn {
        if (!this.instance) {
            this.instance = new BeginOfTurn();
        }

        return this.instance;
    }

    public afkAction(context: Game) {
        context.doAction(Action.START_TURN);
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.START_TURN:
                return context.beginOfTurnAction();

            default:
                throw new InvalidAction;
        }
    }
}
