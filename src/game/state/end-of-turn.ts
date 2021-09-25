import { State, UserActionPayload } from './state';
import { Action, Game, InvalidAction } from '../game';

export class EndOfTurn implements State {
    action(context: Game, action: Action, payload?: UserActionPayload): void {
        switch (action) {
            case Action.END_OF_TURN:
                return context.endOfTurnAction();

            default:
                throw new InvalidAction;
        }
    }
}
