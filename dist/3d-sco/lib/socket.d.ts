import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
export type NextApiResponseServerIO = NextApiResponse & {
    socket: {
        server: NetServer & {
            io: ServerIO;
        };
    };
};
export declare const config: {
    api: {
        bodyParser: boolean;
    };
};
export declare function initializeSocket(server: NetServer): any;
export declare function getOnlineUsersCount(): number;
export declare function getOnlineUsers(): {
    id: string;
    username: string;
    avatar?: string;
    joinedAt: Date;
}[];
export declare function getRoomUsers(roomId: string): string[];
export declare function broadcastToRoom(io: ServerIO, roomId: string, event: string, data: any): void;
export declare function broadcastToUser(io: ServerIO, userId: string, event: string, data: any): void;
//# sourceMappingURL=socket.d.ts.map