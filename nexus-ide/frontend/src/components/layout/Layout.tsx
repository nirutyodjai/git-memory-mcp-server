import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {children}
    </div>
  );
};

export default Layout;