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
interface ChatLayoutProps {
    className?: string;
    defaultRoomId?: string;
    showRoomList?: boolean;
}
export default function ChatLayout({ className, defaultRoomId, showRoomList }: ChatLayoutProps): any;
export type { ChatRoom };
//# sourceMappingURL=ChatLayout.d.ts.map