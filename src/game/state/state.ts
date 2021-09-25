import { Action, Game } from '../game';

export interface UserActionPayload {
    userId: number;
    playerId?: number;
    cardId?: string;
    otherPlayerId?: number;
    otherCardId?: string;
}

export interface State {
    action(context: Game, action: Action, payload?: UserActionPayload): void;
}
