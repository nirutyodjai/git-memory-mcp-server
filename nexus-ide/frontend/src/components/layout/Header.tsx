import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md z-10">
      <div className="text-xl font-bold">NEXUS IDE</div>
      <div>
        {/* Placeholder for user info and controls */}
      </div>
    </header>
  );
};

export default Header;