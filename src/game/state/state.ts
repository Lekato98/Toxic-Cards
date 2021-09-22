import { Action, Game } from "../game";

export interface State {
    context: Game;
    action(action: Action, payload?: any): void;
    // nextState(): void;
}