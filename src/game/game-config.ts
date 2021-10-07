interface Configs {
    numberOfPlayers: number;
    deckSize?: number;
    minEliminateScore?: number;
}

export class GameConfig {
    public readonly numberOfPlayers: number;
    public readonly deckSize: number;
    public readonly minEliminateScore: number;
    private readonly MIN_NUMBER_OF_PLAYERS: number = 3;
    private readonly MAX_NUMBER_OF_PLAYERS: number = 8;
    private readonly MIN_DECK_SIZE: number = 1;
    private readonly MAX_DECK_SIZE: number = 4;

    constructor(configs: Configs) {
        const {
            numberOfPlayers = 4,
            deckSize = 1,
            minEliminateScore = -100,
        } = configs ?? {};

        if (!this.isValidNumberOfPlayers(numberOfPlayers)) {
            throw new Error(`Number of players should be between(${ this.MIN_NUMBER_OF_PLAYERS }, ${ this.MAX_NUMBER_OF_PLAYERS })`);
        }

        if (!this.isValidDeckSize(deckSize)) {
            throw new Error(`Deck size should be between(${ this.MIN_DECK_SIZE }, ${ this.MAX_DECK_SIZE })`);
        }

        this.numberOfPlayers = numberOfPlayers;
        this.minEliminateScore = minEliminateScore;
        this.deckSize = deckSize;
    }

    public isValidNumberOfPlayers(numberOfPlayers: number): boolean {
        return this.MIN_NUMBER_OF_PLAYERS <= numberOfPlayers && numberOfPlayers <= this.MAX_NUMBER_OF_PLAYERS;
    }

    public isValidDeckSize(deckSize: number): boolean {
        return this.MIN_DECK_SIZE <= deckSize && deckSize <= this.MAX_DECK_SIZE;
    }
}
