import { Socket } from 'socket.io';

export class User {
    private readonly id: number;
    private readonly username: string;
    private client: Socket;

    constructor(id: number, username: string, client: Socket) {
        this.id = id;
        this.username = username;
        this.client = client;
    }

    public getId(): number {
        return this.id;
    }

    public getUsername(): string {
        return this.username;
    }

    public emit(event: string, message: any): void {
        this.client.emit(event, message);
    }
}
