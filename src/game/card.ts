import { customAlphabet, customRandom, nanoid } from "nanoid";
import { Action } from "./game";

enum CardSuit {
    CLUBS = 'C',
    DIAMONDS = 'D',
    HEARTS = 'H',
    SPADES = 'S',
}

enum CardRank {
    TWO,
    THREE,
    FOURE,
    FIVE,
    SIX,
    SEVEN,
    EIGHT,
    NINE,
    TEN,
    JACK,
    QUEEN,
    KING,
    ACE,
}

enum CardWeight {
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    SEVEN = 7,
    EIGHT = 8,
    NINE = 9,
    TEN = 10,
    JACK = 11,
    QUEEN = 12,
    RED_KING = 0,
    BLACK_KING = 13,
    ACE = 1,
}

enum CardColor {
    RED = 'red',
    BLACK = 'black',
}

export abstract class CardUtil {
    private static readonly DEFAULT_ID_SIZE = 6;
    public static readonly CARD_SUITS = [CardSuit.CLUBS, CardSuit.DIAMONDS, CardSuit.HEARTS, CardSuit.SPADES];
    public static readonly CARD_RANKS = [
        CardRank.TWO, CardRank.THREE, CardRank.FOURE, 
        CardRank.FIVE, CardRank.SIX, CardRank.SEVEN, 
        CardRank.EIGHT, CardRank.NINE, CardRank.TEN, 
        CardRank.JACK, CardRank.QUEEN, CardRank.KING, 
        CardRank.ACE, 
    ];

    /**
     * getWeight
     */
     public static getWeightBySuitAndRank(suit: CardSuit, rank: CardRank): CardWeight {
        if (rank === CardRank.KING) {
            return CardUtil.isRed(suit) ? CardWeight.RED_KING : CardWeight.BLACK_KING;
        }

        // get key of rank
        const rankName = CardRank[rank];
        return CardWeight[rankName];
    }

    /**
     * getAbility
     */
    public static getActionByRank(rank: CardRank): Action {
        switch(rank) {
            case CardRank.SEVEN:
            case CardRank.EIGHT:
                return Action.SHOW_ONE_HAND_CARD;

            case CardRank.NINE:
            case CardRank.TEN:
                return Action.SHOW_ONE_OTHER_HAND_CARD;
                
            case CardRank.JACK:
                return Action.EXCHANGE_HAND_WITH_OTHER;

            default:
                return Action.NO_ACTION;
        }
    }

    /**
     * getColor
     */
    public static getColor(card: Card): CardColor {
        return CardUtil.isRed(card) ? CardColor.RED : CardColor.BLACK; 
    }

    /**
     * isRed
     */
     public static isRed(suit: CardSuit): boolean;
     public static isRed(card: Card): boolean;
     public static isRed(paramOne: Card | CardSuit): boolean {
        let suit: CardSuit;

        if (paramOne instanceof Card) {
            suit = paramOne.suit;
        } else {
            suit = paramOne;
        }

        return suit === CardSuit.DIAMONDS || suit === CardSuit.HEARTS;
    }

    /**
     * isBlack
     */
    public static isBlack(card: Card): boolean {
        return card.suit === CardSuit.CLUBS || card.suit === CardSuit.SPADES;
    }

    /**
     * isKing
     */
    public static isKing(card: Card): boolean {
        return card.rank === CardRank.KING;
    }

    public static generateRandomId(): string {
        return nanoid(CardUtil.DEFAULT_ID_SIZE);
    }
}

export class Card {
    public readonly id: string;
    public readonly suit: CardSuit;
    public readonly rank: CardRank;
    public readonly weight: CardWeight;
    private used: boolean;
    private readonly action: Action;

    // @todo maybe isUsed in creation should be false always
    constructor(suit: CardSuit, rank: CardRank, used: boolean = false) {
        this.suit = suit;
        this.rank = rank;
        this.used = used;

        this.id = CardUtil.generateRandomId();
        this.weight = CardUtil.getWeightBySuitAndRank(suit, rank);
        this.action = CardUtil.getActionByRank(rank);
    }

    public equalsRank(card: Card): boolean {
        return this.rank === card.rank;
    }

    public markAsUsed(): void {
        this.used = true;
    }

    public isUsed() {
        return this.used;
    }

    public getAbility(): Action {
        if (this.used) {
            return Action.NO_ACTION;
        }

        return this.action;
    }
}
