export abstract class Utils {
    public static isNullOrUndefined(value: any) {
        return value === undefined || value === null;
    }

    public static randomIndex(array: Array<any>): number {
        return Math.floor(Math.random() * array.length);
    }

    public static randomInteger(range: number): number {
        return Math.floor(Math.random() * range);
    }
}
