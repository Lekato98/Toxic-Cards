import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface BurnedPickedPayload extends UserActionPayload {
    cardId: string;
}

export class BurnedPicked implements State {
    private static instance: BurnedPicked;
    public readonly allowedActions;

    private constructor() {
        this.allowedActions = [
            Action.EXCHANGE_PICK_WITH_HAND,
        ];
    }

    public static getInstance(): BurnedPicked {
        if (!this.instance) {
            this.instance = new BurnedPicked();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: BurnedPickedPayload): void {
        switch (action) {
            case Action.EXCHANGE_PICK_WITH_HAND:
                return context.exchangePickWithHandAction(payload.userId, payload.cardId);

            default:
                throw new InvalidAction;
        }
    }
}
