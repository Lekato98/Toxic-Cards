import { nanoid } from 'nanoid';

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

export enum CardAbility {
    SHOW_ONE_HAND_CARD,
    SHOW_ONE_OTHER_HAND_CARD,
    EXCHANGE_HAND_WITH_OTHER,
    NO_ABILITY,
}

export abstract class CardUtil {
    public static readonly CARD_SUITS = [CardSuit.CLUBS, CardSuit.DIAMONDS, CardSuit.HEARTS, CardSuit.SPADES];
    public static readonly CARD_RANKS = [
        CardRank.TWO, CardRank.THREE, CardRank.FOURE,
        CardRank.FIVE, CardRank.SIX, CardRank.SEVEN,
        CardRank.EIGHT, CardRank.NINE, CardRank.TEN,
        CardRank.JACK, CardRank.QUEEN, CardRank.KING,
        CardRank.ACE,
    ];
    private static readonly DEFAULT_ID_SIZE = 6;

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
    public static getAbilityByRank(rank: CardRank): CardAbility {
        switch (rank) {
            case CardRank.SEVEN:
            case CardRank.EIGHT:
                return CardAbility.SHOW_ONE_HAND_CARD;

            case CardRank.NINE:
            case CardRank.TEN:
                return CardAbility.SHOW_ONE_OTHER_HAND_CARD;

            case CardRank.JACK:
                return CardAbility.EXCHANGE_HAND_WITH_OTHER;

            default:
                return CardAbility.NO_ABILITY;
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
    private readonly ability: CardAbility;

    // @todo maybe isUsed in creation should be false always
    constructor(suit: CardSuit, rank: CardRank, used: boolean = false) {
        this.suit = suit;
        this.rank = rank;
        this.used = used;

        this.id = CardUtil.generateRandomId();
        this.weight = CardUtil.getWeightBySuitAndRank(suit, rank);
        this.ability = CardUtil.getAbilityByRank(rank);
    }

    public equalsRank(card: Card): boolean {
        return this.rank === card.rank;
    }

    public equalsSuit(card: Card): boolean {
        return this.suit === card.suit;
    }

    public equalsRankAndSuit(card: Card): boolean {
        return this.equalsRank(card) && this.equalsSuit(card);
    }

    public markAsUsed(): void {
        this.used = true;
    }

    public isUsed() {
        return this.used;
    }

    public getAbility(): CardAbility {
        if (this.used) {
            return CardAbility.NO_ABILITY;
        }

        return this.ability;
    }
}
