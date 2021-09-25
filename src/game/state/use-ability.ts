import { State, UserActionPayload } from './state';
import { Action, Game } from '../game';

class UseAbility implements State {
    private static instance: UseAbility;

    private constructor() {}

    public static getInstance(): UseAbility {
        if (!this.instance) {
            this.instance = new UseAbility();
        }

        return this.instance;
    }

    public action(context: Game, action: Action, payload?: UserActionPayload): void {
    }
}
