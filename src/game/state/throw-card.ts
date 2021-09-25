import { State, UserActionPayload } from './state';
import { Action, Game } from '../game';

class ThrowCard implements State {
    private static instance: ThrowCard;

    private constructor() {}

    public static getInstance(): ThrowCard {
        if (!this.instance) {
            this.instance = new ThrowCard();
        }

        return this.instance;
    }

    public action(context: Game, action: Action, payload?: UserActionPayload): void {
    }


}
