import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';

interface ShowOneHandCardActionPayload extends UserActionPayload {
    cardId: string;
}

export class ShowOneHandCard implements State {
    private static instance: ShowOneHandCard;

    private constructor() {
    }

    public static getInstance(): ShowOneHandCard {
        if (!this.instance) {
            this.instance = new ShowOneHandCard();
        }

        return this.instance;
    }

    // @todo remove any
    public action(context: Game, action: Action, payload?: ShowOneHandCardActionPayload): void {
        switch (action) {
            case Action.SHOW_ONE_HAND_CARD:
                return context.showOneHandCardAction(payload.userId, payload.cardId);

            default:
                throw new InvalidAction;
        }
    }
}
