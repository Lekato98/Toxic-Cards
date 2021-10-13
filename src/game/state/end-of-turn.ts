import { State, UserActionPayload } from './state';
import { Action, Game, InvalidAction } from '../game';
import { GameAction } from '../game-action';

export class EndOfTurn implements State {
    private static instance: EndOfTurn;
    public timeMs: number;

    private constructor() {
        this.timeMs = 0;
    }

    public afkAction(context: Game) {
        context.doAction(Action.END_TURN);
    }

    public static getInstance(): EndOfTurn {
        if (!this.instance) {
            this.instance = new EndOfTurn();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_TURN:
                return context.endOfTurnAction();

            default:
                throw new InvalidAction;
        }
    }
}
