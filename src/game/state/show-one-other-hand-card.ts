import { Action, Game, InvalidAction } from '../game';
import { State, UserActionPayload } from './state';
import { GameAction } from '../game-action';

interface ShowOneOtherHandCardActionPayload extends UserActionPayload {
    otherPlayerId;
    otherCardId;
}

export class ShowOneOtherHandCard implements State {
    private static instance: ShowOneOtherHandCard;
    public timeMs: number;

    private constructor() {
        this.timeMs = 1000;
    }

    public afkAction(context: Game) {
        // const player = context.getCurrentPlayer();
        // const userId = player.getUserId();
        // const card = player.getRandomCard();
        // const cardId = card.id;
        // context.doAction(Action.SHOW_ONE_HAND_CARD, {
        //     userId,
        //     cardId,
        // });
        // @todo get random player
    }

    public static getInstance(): ShowOneOtherHandCard {
        if (!this.instance) {
            this.instance = new ShowOneOtherHandCard();
        }

        return this.instance;
    }

    public action(context: GameAction, action: Action, payload?: ShowOneOtherHandCardActionPayload): void {
        switch (action) {
            case Action.SHOW_ONE_OTHER_HAND_CARD:
                return context.showOneOtherHandCardAction(payload.userId, payload.otherPlayerId, payload.otherCardId);

            default:
                throw new InvalidAction;
        }
    }
}
