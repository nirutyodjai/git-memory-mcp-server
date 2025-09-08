import React, { useState } from 'react';
import { Settings, Zap, Wrench } from 'lucide-react';
import './App.css';
import PluginManager from './components/PluginManager';
import ToolManager from './components/common/ToolManager';

function App() {
  const [count, setCount] = useState(0);
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showToolManager, setShowToolManager] = useState(false);

  return (
    <div className="App">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">MCP Dev Starter</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowToolManager(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Tool Manager</span>
                </button>
                <button
                  onClick={() => setShowPluginManager(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Plugin Manager</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to MCP Development Environment
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                A powerful development starter with Universal Plugin System and MCP integration
              </p>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Counter Demo</h3>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setCount(count - 1)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-gray-800 min-w-[3rem] text-center">
                      {count}
                    </span>
                    <button
                      onClick={() => setCount(count + 1)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">🔌</div>
                    <h4 className="font-semibold text-gray-800 mt-2">Plugin System</h4>
                    <p className="text-sm text-gray-600 mt-1">Universal plugin architecture</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">🔗</div>
                    <h4 className="font-semibold text-gray-800 mt-2">MCP Integration</h4>
                    <p className="text-sm text-gray-600 mt-1">Model Context Protocol support</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">⚡</div>
                    <h4 className="font-semibold text-gray-800 mt-2">Fast Development</h4>
                    <p className="text-sm text-gray-600 mt-1">Hot reload and modern tooling</p>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setShowPluginManager(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Open Plugin Manager</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <PluginManager
          isOpen={showPluginManager}
          onClose={() => setShowPluginManager(false)}
        />
        <ToolManager
          isOpen={showToolManager}
          onClose={() => setShowToolManager(false)}
        />
      </div>
    </div>
  );
}

export default App;