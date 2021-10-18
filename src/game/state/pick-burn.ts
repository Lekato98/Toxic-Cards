import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface PickBurnPayload extends UserActionPayload {
    cardId: string;
}

export class PickBurn implements State {
    private static instance: PickBurn;
    public timeMs: number;

    private constructor() {
        this.timeMs = 10000;
    }

    public static getInstance(): PickBurn {
        if (!this.instance) {
            this.instance = new PickBurn();
        }

        return this.instance;
    }

    public afkAction(context: Game) {
        const player = context.getCurrentPlayer();
        const userId = player.getUserId();
        context.doAction(Action.PICK_CARD_FROM_PILE, {userId});
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
