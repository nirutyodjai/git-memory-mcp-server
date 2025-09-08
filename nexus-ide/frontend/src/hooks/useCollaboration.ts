import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the User type
interface User {
  id: string;
  color: string;
}

// Shared socket instance and subscriber counter to avoid multiple connections
let socketInstance: Socket | null = null;
let subscribers = 0;

const useCollaboration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]); // State for active users
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io('http://localhost:3000', {
        transports: ['websocket'],
        withCredentials: true,
      });
    }

    subscribers += 1;
    socketRef.current = socketInstance;

    const handleConnect = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    };

    const handleMessage = (message: string) => {
      setLastMessage(message);
      console.log('Received message:', message);
    };

    const handleUsersUpdate = (userList: User[]) => {
      setUsers(userList);
      console.log('Updated user list:', userList);
    };

    // Attach listeners for this hook instance
    socketInstance!.on('connect', handleConnect);
    socketInstance!.on('disconnect', handleDisconnect);
    socketInstance!.on('message', handleMessage);
    socketInstance!.on('users:update', handleUsersUpdate);

    return () => {
      if (socketInstance) {
        // Detach listeners added by this hook instance
        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
        socketInstance.off('message', handleMessage);
        socketInstance.off('users:update', handleUsersUpdate);

        subscribers -= 1;
        if (subscribers <= 0) {
          socketInstance.disconnect();
          socketInstance = null;
        }
      }
    };
  }, []);

  const sendMessage = (message: string) => {
    (socketInstance ?? socketRef.current)?.emit('message', message);
  };

  return { isConnected, lastMessage, users, sendMessage }; // Return users
};

export default useCollaboration;