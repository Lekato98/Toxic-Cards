import { State, UserActionPayload } from './state';
import { Action, InvalidAction } from '../game';
import { GameAction } from '../game-action';

export class EndOfGame implements State {
    private static instance: EndOfGame;

    private constructor() {
    }

    public static getInstance(): EndOfGame {
        if (!this.instance) {
            this.instance = new EndOfGame();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_OF_GAME:
                return context.endOfGameAction();

            default:
                throw new InvalidAction;
        }
    }

}
