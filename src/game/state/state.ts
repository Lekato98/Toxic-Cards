import { Action, Game } from '../game';
import { GameAction } from '../game-action';

export interface UserActionPayload {
    userId: number;
    playerId?: number;
    cardId?: string;
    otherPlayerId?: number;
    otherCardId?: string;
}

export interface State {
    timeMs: number;

    action(context: GameAction, action: Action, payload?: UserActionPayload): void;

    afkAction(context: Game);
}
