import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface BurnedPickedPayload extends UserActionPayload {
    cardId: string;
}

export class BurnedPicked implements State {
    private static instance: BurnedPicked;
    public timeMs: number;

    private constructor() {
        this.timeMs = 10000;
    }

    public static getInstance(): BurnedPicked {
        if (!this.instance) {
            this.instance = new BurnedPicked();
        }

        return this.instance;
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

    public action(context: GameAction, action: Action, payload?: BurnedPickedPayload): void {
        switch (action) {
            case Action.EXCHANGE_PICK_WITH_HAND:
                return context.exchangePickWithHandAction(payload.userId, payload.cardId);

            default:
                throw new InvalidAction;
        }
    }
}
