interface ChatListProps {
    onRoomSelect: (roomId: string) => void;
    selectedRoomId?: string;
    user: {
        id: string;
        username: string;
    };
    className?: string;
}
export default function ChatList({ onRoomSelect, selectedRoomId, user, className }: ChatListProps): any;
export {};
//# sourceMappingURL=ChatList.d.ts.map