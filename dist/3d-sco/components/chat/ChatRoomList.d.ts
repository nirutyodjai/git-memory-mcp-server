interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    isPrivate: boolean;
    memberCount: number;
    lastMessage?: {
        content: string;
        author: string;
        timestamp: Date;
    };
    unreadCount: number;
    isActive?: boolean;
}
interface ChatRoomListProps {
    onRoomSelect: (room: ChatRoom) => void;
    selectedRoomId?: string;
}
export default function ChatRoomList({ onRoomSelect, selectedRoomId }: ChatRoomListProps): any;
export {};
//# sourceMappingURL=ChatRoomList.d.ts.map