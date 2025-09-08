/**
 * Mock Service Worker (MSW) Server Configuration
 * 
 * This file sets up MSW for mocking API requests during testing.
 * It includes handlers for all major API endpoints used in NEXUS IDE.
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse, ws } from 'msw';
import type { DefaultBodyType, StrictRequest } from 'msw';

// Mock data types
interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'developer' | 'viewer';
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    fontSize: number;
    keyBindings: 'vscode' | 'vim' | 'emacs';
  };
}

interface MockProject {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'mobile' | 'desktop' | 'library';
  language: string;
  framework?: string;
  repository: {
    url: string;
    branch: string;
    lastCommit: {
      hash: string;
      message: string;
      author: string;
      timestamp: string;
    };
  };
  collaborators: string[];
  settings: {
    autoSave: boolean;
    linting: boolean;
    formatting: boolean;
    testing: boolean;
  };
}

interface MockFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
  language?: string;
  lastModified: string;
  gitStatus?: 'modified' | 'added' | 'deleted' | 'untracked' | 'staged';
  children?: MockFile[];
}

interface MockAIResponse {
  id: string;
  type: 'completion' | 'explanation' | 'suggestion' | 'error';
  content: string;
  confidence: number;
  metadata?: {
    model: string;
    tokens: number;
    processingTime: number;
  };
}

// Mock data
const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://avatar.example.com/john.jpg',
    role: 'developer',
    preferences: {
      theme: 'dark',
      language: 'en',
      fontSize: 14,
      keyBindings: 'vscode',
    },
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://avatar.example.com/jane.jpg',
    role: 'admin',
    preferences: {
      theme: 'light',
      language: 'en',
      fontSize: 16,
      keyBindings: 'vim',
    },
  },
];

const mockProjects: MockProject[] = [
  {
    id: 'proj-1',
    name: 'NEXUS IDE',
    description: 'Next-generation IDE with AI capabilities',
    type: 'web',
    language: 'TypeScript',
    framework: 'React',
    repository: {
      url: 'https://github.com/nexus/nexus-ide',
      branch: 'main',
      lastCommit: {
        hash: 'abc123',
        message: 'Add AI copilot features',
        author: 'John Doe',
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
    collaborators: ['1', '2'],
    settings: {
      autoSave: true,
      linting: true,
      formatting: true,
      testing: true,
    },
  },
];

const mockFiles: MockFile[] = [
  {
    id: 'file-1',
    name: 'src',
    path: '/src',
    type: 'directory',
    lastModified: '2024-01-15T10:30:00Z',
    children: [
      {
        id: 'file-2',
        name: 'App.tsx',
        path: '/src/App.tsx',
        type: 'file',
        size: 1024,
        content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello NEXUS IDE</div>;\n}\n\nexport default App;',
        language: 'typescript',
        lastModified: '2024-01-15T10:30:00Z',
        gitStatus: 'modified',
      },
      {
        id: 'file-3',
        name: 'components',
        path: '/src/components',
        type: 'directory',
        lastModified: '2024-01-15T10:30:00Z',
        children: [
          {
            id: 'file-4',
            name: 'Editor.tsx',
            path: '/src/components/Editor.tsx',
            type: 'file',
            size: 2048,
            content: 'import React from "react";\nimport { Monaco } from "@monaco-editor/react";\n\nexport const Editor = () => {\n  return <Monaco />;\n};',
            language: 'typescript',
            lastModified: '2024-01-15T10:30:00Z',
            gitStatus: 'added',
          },
        ],
      },
    ],
  },
];

// API Handlers
const handlers = [
  // Authentication
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: mockUsers[0],
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),
  
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),
  
  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
    });
  }),
  
  // User Management
  http.get('/api/users/me', () => {
    return HttpResponse.json(mockUsers[0]);
  }),
  
  http.put('/api/users/me', async ({ request }) => {
    const updates = await request.json();
    const updatedUser = { ...mockUsers[0], ...updates };
    return HttpResponse.json(updatedUser);
  }),
  
  http.get('/api/users', () => {
    return HttpResponse.json(mockUsers);
  }),
  
  // Project Management
  http.get('/api/projects', () => {
    return HttpResponse.json(mockProjects);
  }),
  
  http.get('/api/projects/:id', ({ params }) => {
    const project = mockProjects.find(p => p.id === params.id);
    if (!project) {
      return HttpResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(project);
  }),
  
  http.post('/api/projects', async ({ request }) => {
    const projectData = await request.json() as Partial<MockProject>;
    const newProject: MockProject = {
      id: `proj-${Date.now()}`,
      name: projectData.name || 'New Project',
      description: projectData.description || '',
      type: projectData.type || 'web',
      language: projectData.language || 'JavaScript',
      framework: projectData.framework,
      repository: {
        url: '',
        branch: 'main',
        lastCommit: {
          hash: '',
          message: 'Initial commit',
          author: 'System',
          timestamp: new Date().toISOString(),
        },
      },
      collaborators: ['1'],
      settings: {
        autoSave: true,
        linting: true,
        formatting: true,
        testing: false,
      },
    };
    
    mockProjects.push(newProject);
    return HttpResponse.json(newProject, { status: 201 });
  }),
  
  // File System
  http.get('/api/projects/:projectId/files', ({ params }) => {
    const { projectId } = params;
    // In a real implementation, this would filter by project
    return HttpResponse.json(mockFiles);
  }),
  
  http.get('/api/projects/:projectId/files/*', ({ params, request }) => {
    const url = new URL(request.url);
    const filePath = url.pathname.split('/files')[1];
    
    const findFile = (files: MockFile[], path: string): MockFile | null => {
      for (const file of files) {
        if (file.path === path) {
          return file;
        }
        if (file.children) {
          const found = findFile(file.children, path);
          if (found) return found;
        }
      }
      return null;
    };
    
    const file = findFile(mockFiles, filePath);
    if (!file) {
      return HttpResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(file);
  }),
  
  http.post('/api/projects/:projectId/files', async ({ params, request }) => {
    const fileData = await request.json() as Partial<MockFile>;
    const newFile: MockFile = {
      id: `file-${Date.now()}`,
      name: fileData.name || 'untitled',
      path: fileData.path || '/untitled',
      type: fileData.type || 'file',
      size: fileData.content?.length || 0,
      content: fileData.content || '',
      language: fileData.language,
      lastModified: new Date().toISOString(),
      gitStatus: 'added',
    };
    
    return HttpResponse.json(newFile, { status: 201 });
  }),
  
  http.put('/api/projects/:projectId/files/*', async ({ params, request }) => {
    const updates = await request.json();
    const url = new URL(request.url);
    const filePath = url.pathname.split('/files')[1];
    
    // Mock file update
    const updatedFile = {
      id: `file-${Date.now()}`,
      name: updates.name || 'updated-file',
      path: filePath,
      type: 'file' as const,
      size: updates.content?.length || 0,
      content: updates.content || '',
      language: updates.language,
      lastModified: new Date().toISOString(),
      gitStatus: 'modified' as const,
    };
    
    return HttpResponse.json(updatedFile);
  }),
  
  // AI Services
  http.post('/api/ai/completion', async ({ request }) => {
    const { prompt, context } = await request.json() as { prompt: string; context?: string };
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response: MockAIResponse = {
      id: `ai-${Date.now()}`,
      type: 'completion',
      content: `// AI-generated code based on: ${prompt}\nfunction generatedFunction() {\n  // Implementation here\n  return 'AI generated this';\n}`,
      confidence: 0.85,
      metadata: {
        model: 'gpt-4',
        tokens: 150,
        processingTime: 500,
      },
    };
    
    return HttpResponse.json(response);
  }),
  
  http.post('/api/ai/explain', async ({ request }) => {
    const { code } = await request.json() as { code: string };
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response: MockAIResponse = {
      id: `ai-${Date.now()}`,
      type: 'explanation',
      content: `This code appears to be a ${code.includes('function') ? 'function' : 'code snippet'} that performs specific operations. The AI analysis suggests it's well-structured and follows best practices.`,
      confidence: 0.92,
      metadata: {
        model: 'claude-3',
        tokens: 75,
        processingTime: 300,
      },
    };
    
    return HttpResponse.json(response);
  }),
  
  http.post('/api/ai/suggest', async ({ request }) => {
    const { context, cursor } = await request.json() as { context: string; cursor: number };
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const suggestions = [
      'console.log()',
      'const result = ',
      'if (condition) {',
      'return value;',
      'async function',
    ];
    
    const response: MockAIResponse = {
      id: `ai-${Date.now()}`,
      type: 'suggestion',
      content: JSON.stringify(suggestions),
      confidence: 0.78,
      metadata: {
        model: 'codex',
        tokens: 25,
        processingTime: 200,
      },
    };
    
    return HttpResponse.json(response);
  }),
  
  // Git Operations
  http.get('/api/projects/:projectId/git/status', () => {
    return HttpResponse.json({
      branch: 'main',
      ahead: 2,
      behind: 0,
      staged: 3,
      unstaged: 5,
      untracked: 2,
      conflicts: 0,
    });
  }),
  
  http.post('/api/projects/:projectId/git/commit', async ({ request }) => {
    const { message, files } = await request.json() as { message: string; files: string[] };
    
    return HttpResponse.json({
      hash: `commit-${Date.now()}`,
      message,
      author: 'Test User',
      timestamp: new Date().toISOString(),
      filesChanged: files.length,
    });
  }),
  
  // Collaboration
  http.get('/api/projects/:projectId/collaborators', () => {
    return HttpResponse.json(mockUsers);
  }),
  
  http.post('/api/projects/:projectId/collaborators', async ({ request }) => {
    const { email } = await request.json() as { email: string };
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ success: true, user });
  }),
  
  // Settings
  http.get('/api/settings', () => {
    return HttpResponse.json({
      theme: 'dark',
      language: 'en',
      fontSize: 14,
      keyBindings: 'vscode',
      autoSave: true,
      linting: true,
      formatting: true,
      aiAssistance: true,
      notifications: {
        desktop: true,
        email: false,
        push: true,
      },
    });
  }),
  
  http.put('/api/settings', async ({ request }) => {
    const settings = await request.json();
    return HttpResponse.json({ success: true, settings });
  }),
  
  // Error simulation endpoints
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),
  
  http.get('/api/error/404', () => {
    return HttpResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }),
  
  http.get('/api/error/timeout', async () => {
    // Simulate timeout
    await new Promise(resolve => setTimeout(resolve, 10000));
    return HttpResponse.json({ data: 'This should timeout' });
  }),
];

// WebSocket handlers for real-time features
const wsHandlers = [
  ws.link('ws://localhost:3001/collaboration'),
  ws.link('ws://localhost:3001/ai-assistant'),
  ws.link('ws://localhost:3001/file-sync'),
];

// Create and export the server
export const server = setupServer(...handlers, ...wsHandlers);

// Export handlers for individual test customization
export { handlers, wsHandlers };

// Export mock data for test assertions
export { mockUsers, mockProjects, mockFiles };

// Utility functions for tests
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: `user-${Date.now()}`,
  name: 'Test User',
  email: 'test@example.com',
  role: 'developer',
  preferences: {
    theme: 'dark',
    language: 'en',
    fontSize: 14,
    keyBindings: 'vscode',
  },
  ...overrides,
});

export const createMockProject = (overrides: Partial<MockProject> = {}): MockProject => ({
  id: `proj-${Date.now()}`,
  name: 'Test Project',
  description: 'A test project',
  type: 'web',
  language: 'TypeScript',
  repository: {
    url: 'https://github.com/test/test-project',
    branch: 'main',
    lastCommit: {
      hash: 'test123',
      message: 'Test commit',
      author: 'Test User',
      timestamp: new Date().toISOString(),
    },
  },
  collaborators: ['1'],
  settings: {
    autoSave: true,
    linting: true,
    formatting: true,
    testing: false,
  },
  ...overrides,
});

export const createMockFile = (overrides: Partial<MockFile> = {}): MockFile => ({
  id: `file-${Date.now()}`,
  name: 'test.ts',
  path: '/test.ts',
  type: 'file',
  size: 100,
  content: 'console.log("test");',
  language: 'typescript',
  lastModified: new Date().toISOString(),
  gitStatus: 'modified',
  ...overrides,
});