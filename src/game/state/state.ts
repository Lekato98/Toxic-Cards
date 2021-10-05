import { Action } from '../game';
import { GameAction } from '../game-action';

export interface UserActionPayload {
    userId: number;
    playerId?: number;
    cardId?: string;
    otherPlayerId?: number;
    otherCardId?: string;
}

export interface State {
    action(context: GameAction, action: Action, payload?: UserActionPayload): void;
}
