import { Action, Game } from "../game";

export interface UserActionPayload {
    userId: number;
}

export interface State {
    action(context: Game, action: Action, payload?: UserActionPayload): void;
}