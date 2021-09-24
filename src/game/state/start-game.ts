import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

export class StartGame implements State {
    action(context: Game, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.START_GAME:
                return context.startGameAction();

            default:
                throw new InvalidAction;
        }
    }
}
