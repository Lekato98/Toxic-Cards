import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

export class Burn implements State {
    private static instance: Burn;
    public timeMs: number;

    private constructor() {
        this.timeMs = 0;
    }

    public static getInstance(): Burn {
        if (!this.instance) {
            this.instance = new Burn();
        }

        return this.instance;
    }

    public afkAction(context: Game) {
        context.doAction(Action.BURN_CARD);
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.BURN_CARD:
                return context.burnAction();

            default:
                throw new InvalidAction;
        }
    }
}
