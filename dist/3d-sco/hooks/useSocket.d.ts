export declare function useSocket(serverPath?: string): {
    socket: any;
    isConnected: any;
    connectionError: any;
    onlineUsers: any;
    messages: any;
    typingUsers: any;
    notifications: any;
    joinAsUser: any;
    joinRoom: any;
    leaveRoom: any;
    sendMessage: any;
    startTyping: any;
    stopTyping: any;
    handleTyping: any;
    sendNotification: any;
    clearMessages: any;
    clearNotifications: any;
    removeNotification: any;
    markNotificationAsRead: any;
    reconnect: any;
    getRoomMessages: any;
    getRoomTypingUsers: any;
};
export declare function useChatRoom(roomId: string, user: {
    id: string;
    username: string;
    avatar?: string;
}): {
    socket: any;
    isConnected: any;
    messages: any;
    typingUsers: any;
    isTyping: any;
    sendMessage: any;
    handleTyping: any;
    clearMessages: () => any;
};
export declare function useNotifications(userId: string): {
    notifications: any;
    unreadCount: any;
    sendToUser: any;
    clearAll: any;
    markAsRead: any;
};
//# sourceMappingURL=useSocket.d.ts.map