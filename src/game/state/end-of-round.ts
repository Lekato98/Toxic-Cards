import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

export class EndOfRound implements State {
    private static instance: EndOfRound;
    public timeMs: number;

    private constructor() {
        this.timeMs = 0;
    }

    public afkAction(context: Game) {
        context.doAction(Action.END_ROUND);
    }

    public static getInstance(): EndOfRound {
        if (!this.instance) {
            this.instance = new EndOfRound();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_ROUND:
                return context.endOfRoundAction();

            default:
                throw new InvalidAction;
        }
    }
}
