import { Action, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface PickBurnPayload extends UserActionPayload {
    cardId: string;
}

export class PickBurn implements State {
    private static instance: PickBurn;

    private constructor() {
    }

    public static getInstance(): PickBurn {
        if (!this.instance) {
            this.instance = new PickBurn();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: PickBurnPayload): void {
        switch (action) {
            case Action.PICK_CARD_FROM_PILE:
                return context.pickCardFromPileAction();

            case Action.PICK_CARD_FROM_BURNED:
                return context.pickCardFromBurnedAction();

            case Action.BURN_ONE_HAND_CARD:
                return context.burnOneHandCardAction(payload.userId, payload.cardId);

            default:
                throw new InvalidAction;
        }
    }
}
