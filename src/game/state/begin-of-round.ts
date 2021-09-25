import { Action, Game, InvalidAction } from '../game';
import { State } from './state';

export class BeginOfRound implements State {
    action(context: Game, action: Action, payload?: any): void {
        switch (action) {
            case Action.BEGIN_OF_ROUND:
                return context.beginOfRoundAction();

            default:
                throw new InvalidAction;
        }
    }
}
