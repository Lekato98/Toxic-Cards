import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

export class EndOfRound implements State {
    action(context: Game, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_OF_ROUND:
                return context.endOfRoundAction();

            default:
                throw new InvalidAction;
        }
    }
}
