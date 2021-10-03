import { Action, Game, InvalidAction } from '../game';
import { State } from './state';
import { GameAction } from '../game-action';

export class BeginOfRound implements State {
    private static instance: BeginOfRound;

    private constructor() {
    }

    public static getInstance(): BeginOfRound {
        if (!this.instance) {
            this.instance = new BeginOfRound();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: any): void {
        switch (action) {
            case Action.BEGIN_OF_ROUND:
                return context.beginOfRoundAction();

            default:
                throw new InvalidAction;
        }
    }
}
