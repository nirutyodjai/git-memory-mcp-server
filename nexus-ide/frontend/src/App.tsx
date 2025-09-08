import React from 'react';
import Editor from './features/editor/Editor';
import UserList from './features/collaboration/UserList';
import { Chat } from './features/collaboration/Chat';
import { socket } from './socket';
import FileExplorer from './features/file-explorer/FileExplorer';

function App() {
  const [cursorPos, setCursorPos] = React.useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [language, setLanguage] = React.useState<string>('javascript');
  const [users, setUsers] = React.useState<{ id: string; name: string; color: string }[]>([]);
  const [isConnected, setIsConnected] = React.useState(socket.connected);

  React.useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onUsersEvent(value: { id: string; name: string; color: string }[]) {
      setUsers(value);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('users', onUsersEvent);
    
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('users', onUsersEvent);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <FileExplorer />
      <UserList users={users} />
      <div className="flex-1 flex flex-col">
        <div className="p-2 bg-gray-800 text-sm">Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
        <Editor onCursorPositionChange={setCursorPos} language={language} users={users} />
      </div>
      <div className="w-80 flex flex-col bg-gray-800 border-l border-gray-700">
        <Chat />
      </div>
    </div>
  );
}

export default App;
