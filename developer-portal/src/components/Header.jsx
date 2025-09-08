import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const baseNavItem = 'px-3 py-2 rounded hover:text-white';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">
        <Link to="/">Developer Portal</Link>
      </div>
      <nav className="flex items-center gap-2">
        <NavLink
          to="/api-docs"
          className={({ isActive }) => `${baseNavItem} ${isActive ? 'text-white' : 'text-gray-300'}`}
        >
          API Docs
        </NavLink>
        <NavLink
          to="/community"
          className={({ isActive }) => `${baseNavItem} ${isActive ? 'text-white' : 'text-gray-300'}`}
        >
          Community
        </NavLink>
        <NavLink
          to="/support"
          className={({ isActive }) => `${baseNavItem} ${isActive ? 'text-white' : 'text-gray-300'}`}
        >
          Support
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${baseNavItem} hidden sm:inline ${isActive ? 'text-white' : 'text-gray-300'}`}
        >
          Dashboard
        </NavLink>
        {/* New top-level quick links */}
        <NavLink
          to="/ai/copilot"
          className={({ isActive }) => `${baseNavItem} hidden md:inline ${isActive ? 'text-white' : 'text-gray-300'}`}
        >
          AI Copilot
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) => `${baseNavItem} hidden md:inline ${isActive ? 'text-white' : 'text-gray-300'}`}
        >
          Projects
        </NavLink>
        <span className="h-6 w-px bg-gray-600 mx-2 hidden sm:inline-block" aria-hidden="true" />
        {/* Tools dropdown (no external dependencies) */}
        <details className="relative">
          <summary className="cursor-pointer px-3 py-2 rounded text-gray-300 hover:text-white select-none">More</summary>
          <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 p-2 grid grid-cols-2 gap-1">
            <NavLink to="/ide" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>IDE</NavLink>
            <NavLink to="/projects" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>Projects</NavLink>
            <NavLink to="/projects/new" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>New Project</NavLink>
            <NavLink to="/prd/sync" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>PRD Sync</NavLink>
            <NavLink to="/ai/copilot" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>AI Copilot</NavLink>
            <NavLink to="/terminal" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>Terminal</NavLink>
            <NavLink to="/code-review" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>Code Review</NavLink>
            <NavLink to="/tests" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>Tests</NavLink>
            <NavLink to="/bug-fixer" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>Bug Fixer</NavLink>
            <NavLink to="/security" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>Security</NavLink>
            <NavLink to="/logs" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>Logs</NavLink>
            <NavLink to="/api-docs" className={({ isActive }) => `px-2 py-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-300'}`}>API Docs</NavLink>
          </div>
        </details>
        <span className="h-6 w-px bg-gray-600 mx-2 hidden sm:inline-block" aria-hidden="true" />
        <Link to="/ide" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded">Launch IDE</Link>
        <Link to="/get-started" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded hidden sm:inline">Get Started</Link>
        <Link to="/login" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded">Login</Link>
      </nav>
    </header>
  );
};

export default Header;