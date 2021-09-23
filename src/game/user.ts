export class User {
    private id: number;
    private username: string;

    constructor(id: number, username: string) {
        this.id = id;
        this.username = username;
    }

    public getId(): number {
        return this.id;
    }

    public getUsername(): string {
        return this.username;
    }
}