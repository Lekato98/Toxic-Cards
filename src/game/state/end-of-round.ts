import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

export class EndOfRound implements State {
    private static instance: EndOfRound;

    private constructor() {
    }

    public static getInstance(): EndOfRound {
        if (!this.instance) {
            this.instance = new EndOfRound();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_OF_ROUND:
                return context.endOfRoundAction();

            default:
                throw new InvalidAction;
        }
    }
}
