import { ReactNode } from "react";
export type User = {
    socketId: string;
    name: string;
    color: string;
    pos: {
        x: number;
        y: number;
    };
    location: string;
    flag: string;
};
export type Message = {
    socketId: string;
    content: string;
    time: Date;
    username: string;
};
export type UserMap = Map<string, User>;
export declare const SocketContext: any;
declare const SocketContextProvider: ({ children }: {
    children: ReactNode;
}) => any;
export default SocketContextProvider;
//# sourceMappingURL=socketio.d.ts.map