export interface ChatMessage {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
        role?: 'admin' | 'moderator' | 'member';
    };
    timestamp: Date;
    edited?: boolean;
    editedAt?: Date;
    reactions?: {
        emoji: string;
        count: number;
        users: string[];
    }[];
    replyTo?: {
        id: string;
        author: string;
        content: string;
    };
    attachments?: {
        id: string;
        name: string;
        url: string;
        type: 'image' | 'file' | 'video';
        size?: number;
    }[];
    isPinned?: boolean;
    isSystem?: boolean;
}
interface ChatMessageProps {
    message: ChatMessage;
    currentUserId?: string;
    isOwn?: boolean;
    showAvatar?: boolean;
    isGrouped?: boolean;
    onReply?: (message: ChatMessage) => void;
    onEdit?: (messageId: string, newContent: string) => void;
    onDelete?: (messageId: string) => void;
    onReact?: (messageId: string, emoji: string) => void;
    onPin?: (messageId: string) => void;
    className?: string;
}
export default function ChatMessage({ message, currentUserId, isOwn, showAvatar, isGrouped, onReply, onEdit, onDelete, onReact, onPin, className }: ChatMessageProps): any;
export {};
//# sourceMappingURL=ChatMessage.d.ts.map