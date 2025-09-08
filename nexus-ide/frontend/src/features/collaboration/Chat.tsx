import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface Message {
  user: string;
  text: string;
}

export const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<Message[]>([]);

  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      setChatLog((prevChatLog) => [...prevChatLog, newMessage]);
    };

    socket.on('chat message', handleNewMessage);

    return () => {
      socket.off('chat message', handleNewMessage);
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // For now, let's just use a hardcoded user.
      // This will be replaced with actual user management later.
      socket.emit('chat message', { user: 'User', text: message });
      setMessage('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid #ccc', padding: '10px' }}>
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {chatLog.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ flexGrow: 1, padding: '5px' }}
          placeholder="Type a message..."
        />
        <button type="submit" style={{ padding: '5px 10px' }}>Send</button>
      </form>
    </div>
  );
};