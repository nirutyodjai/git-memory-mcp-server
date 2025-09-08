import React from 'react';

interface StatusBarProps {
  language?: string;
  position?: { line: number; column: number };
  connected?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ 
  language = 'javascript', 
  position = { line: 1, column: 1 },
  connected = true 
}) => {
  return (
    <div className="h-6 bg-gray-800 border-t border-gray-700 flex items-center px-4 text-xs text-gray-400 justify-between">
      <div className="flex items-center space-x-4">
        <div>{language}</div>
        <div>Line {position.line}, Column {position.column}</div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div>UTF-8</div>
        <div>LF</div>
      </div>
    </div>
  );
};

export default StatusBar;