import { useState } from 'react'
import { ChevronRightIcon, PlayIcon, CogIcon, ChartBarIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: ChartBarIcon },
    { name: 'MCP Servers', id: 'servers', icon: CogIcon },
    { name: 'Documentation', id: 'docs', icon: DocumentTextIcon },
    { name: 'Team', id: 'team', icon: UserGroupIcon },
  ]

  const mcpServers = [
    { name: 'Filesystem', status: 'running', description: 'File system operations' },
    { name: 'Memory', status: 'running', description: 'Memory management' },
    { name: 'Playwright', status: 'running', description: 'Browser automation' },
    { name: 'Blender', status: 'running', description: '3D modeling and rendering' },
    { name: 'Git', status: 'running', description: 'Git repository management' },
    { name: 'Fetch', status: 'running', description: 'HTTP requests and data fetching' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">MCP Control Panel</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-primary">
                <PlayIcon className="w-4 h-4 mr-2 inline" />
                Start All Servers
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      activeTab === item.id
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
                  <p className="text-gray-600">Monitor and manage your MCP servers</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Servers</p>
                        <p className="text-2xl font-bold text-gray-900">{mcpServers.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ChartBarIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Requests</p>
                        <p className="text-2xl font-bold text-gray-900">1,234</p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <CogIcon className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Uptime</p>
                        <p className="text-2xl font-bold text-gray-900">99.9%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Server Status */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Status</h3>
                  <div className="space-y-3">
                    {mcpServers.map((server, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-900">{server.name}</p>
                            <p className="text-sm text-gray-600">{server.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {server.status}
                          </span>
                          <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'servers' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">MCP Servers</h2>
                  <p className="text-gray-600">Manage your Model Context Protocol servers</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mcpServers.map((server, index) => (
                    <div key={index} className="card hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{server.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {server.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{server.description}</p>
                      <div className="flex space-x-2">
                        <button className="btn-primary text-sm">Configure</button>
                        <button className="btn-secondary text-sm">Logs</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h2>
                  <p className="text-gray-600">Learn how to use and configure MCP servers</p>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-600 mb-4">
                      Model Context Protocol (MCP) servers provide standardized interfaces for AI assistants to interact with various tools and services.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li>Configure servers in trae-mcp.json</li>
                      <li>Start servers using the control panel</li>
                      <li>Monitor server status and logs</li>
                      <li>Integrate with Trae AI IDE</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Team</h2>
                  <p className="text-gray-600">Manage team access and permissions</p>
                </div>

                <div className="card">
                  <p className="text-gray-600">Team management features coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
