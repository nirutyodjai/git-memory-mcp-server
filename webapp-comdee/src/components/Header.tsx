import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800">Comdee</div>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="#" className="text-gray-600 hover:text-gray-800">Home</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-800">Services</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-800">Products</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-800">About Us</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-800">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;