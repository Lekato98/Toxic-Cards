import { State, UserActionPayload } from './state';
import { Action, Game, InvalidAction } from '../game';
import { GameAction } from '../game-action';

export class EndOfGame implements State {
    private static instance: EndOfGame;
    public timeMs: number;

    private constructor() {
        this.timeMs = 0;
    }

    public static getInstance(): EndOfGame {
        if (!this.instance) {
            this.instance = new EndOfGame();
        }

        return this.instance;
    }

    public afkAction(context: Game) {
        context.doAction(Action.END_GAME);
    }

    public action(context: GameAction, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_GAME:
                return context.endOfGameAction();

            default:
                throw new InvalidAction;
        }
    }

}
