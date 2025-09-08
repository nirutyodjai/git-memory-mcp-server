import React from 'react';
import useCollaboration from '../../hooks/useCollaboration';

const Collaboration: React.FC = () => {
  const { isConnected, lastMessage, users, sendMessage } = useCollaboration();
  const [message, setMessage] = React.useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="bg-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4">Collaboration</h2>
      <p className="mb-4">Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Active Users ({users.length})</h3>
        <div className="flex flex-wrap gap-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2 bg-gray-700 px-2 py-1 rounded-full text-sm">
              <span style={{ backgroundColor: user.color }} className="w-3 h-3 rounded-full"></span>
              <span>{user.id.substring(0, 6)}...</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-2 rounded-l-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
        >
          Send
        </button>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Last Message Received:</h3>
        <p className="p-2 bg-gray-700 rounded-md min-h-[40px]">{lastMessage}</p>
      </div>
    </div>
  );
};

export default Collaboration;