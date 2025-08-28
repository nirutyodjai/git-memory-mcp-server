interface ChatRoomProps {
    roomId: string;
    user: {
        id: string;
        username: string;
        avatar?: string;
    };
    className?: string;
}
export default function ChatRoom({ roomId, user, className }: ChatRoomProps): any;
export {};
//# sourceMappingURL=ChatRoom.d.ts.map