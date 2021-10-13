import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface PilePickedPayload extends UserActionPayload {
    cardId?: string;
}

export class PilePicked implements State {
    private static instance: PilePicked;
    public timeMs: number;

    private constructor() {
        this.timeMs = 5000;
    }

    public afkAction(context: Game) {
        const player = context.getCurrentPlayer();
        const userId = player.getUserId();
        const card = player.getRandomCard();
        const cardId = card.id;
        context.doAction(Action.EXCHANGE_PICK_WITH_HAND, {
            userId,
            cardId,
        });
    }

    public static getInstance(): PilePicked {
        if (!this.instance) {
            this.instance = new PilePicked();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: PilePickedPayload): void {
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
