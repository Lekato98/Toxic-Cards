import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

interface PilePickedPayload extends UserActionPayload {
    cardId?: string;
}

export class PilePicked implements State {
    private static instance: PilePicked;

    private constructor() {
    }

    public static getInstance(): PilePicked {
        if (!this.instance) {
            this.instance = new PilePicked();
        }

        return this.instance;
    }

    public action(context: Game, action: Action, payload?: PilePickedPayload): void {
        switch (action) {
            case Action.THROW_CARD:
                return context.useAbilityAction();

            case Action.EXCHANGE_PICK_WITH_HAND:
                return context.exchangePickWithHandAction(payload?.userId, payload?.cardId);

            default:
                throw new InvalidAction;
        }
    }
}
