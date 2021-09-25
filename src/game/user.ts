import { Socket } from 'socket.io';

export class User {
    private readonly id: number;
    private readonly username: string;
    private readonly socket: Socket;

    constructor(id: number, username: string, socket: Socket) {
        this.id = id;
        this.username = username;
        this.socket = socket;
    }

    public getId(): number {
        return this.id;
    }

    public getUsername(): string {
        return this.username;
    }

    public equals(user: User): boolean {
        return this.id === user.id;
    }

    public emit(event: string, message: any): void {
        this.socket.emit(event, message);
    }
}
