import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

export class BeginOfGame implements State {
    private static instance: BeginOfGame;

    private constructor() {
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
