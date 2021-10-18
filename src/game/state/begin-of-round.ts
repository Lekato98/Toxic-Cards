import { Action, Game, InvalidAction } from '../game';
import { State } from './state';
import { GameAction } from '../game-action';

export class BeginOfRound implements State {
    private static instance: BeginOfRound;
    public timeMs: number;

    private constructor() {
        this.timeMs = 0;
    }

    public static getInstance(): BeginOfRound {
        if (!this.instance) {
            this.instance = new BeginOfRound();
        }

        return this.instance;
    }

    public afkAction(context: Game) {
        context.doAction(Action.START_ROUND);
    }

    public action(context: GameAction, action: Action, payload?: any): void {
        switch (action) {
            case Action.START_ROUND:
                return context.beginOfRoundAction();

            default:
                throw new InvalidAction;
        }
    }
}
