import { State, UserActionPayload } from './state';
import { Action, Game, InvalidAction } from '../game';

export class EndOfGame implements State {
    action(context: Game, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_OF_GAME:
                return context.endOfGameAction();

            default:
                throw new InvalidAction;
        }
    }

}
