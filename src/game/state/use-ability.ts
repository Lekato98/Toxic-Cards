import { State, UserActionPayload } from './state';
import { Action, Game } from '../game';

class UseAbility implements State {
    action(context: Game, action: Action, payload?: UserActionPayload): void {
    }

}
