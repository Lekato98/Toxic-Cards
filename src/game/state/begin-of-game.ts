import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

export class BeginOfGame implements State {
    private static instance: BeginOfGame;
    public timeMs: number;

    private constructor() {
        this.timeMs = 20000; // 20 sec
    }

    public afkAction(context: Game): void {
        const userId = context.leader;
        context.doAction(Action.START_GAME, {userId});
    }

    public static getInstance(): BeginOfGame {
        if (!this.instance) {
            this.instance = new BeginOfGame();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.START_GAME:
                return context.beginOfGameAction();

            default:
                throw new InvalidAction;
        }
    }
}
