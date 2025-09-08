/**
 * Visual Programming Interface
 * ระบบเขียนโปรแกรมแบบ visual drag-and-drop
 * รองรับการสร้าง workflow และ logic flow แบบ visual
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  Background, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { aiCodeAssistant } from '../../services/AICodeAssistant';
import { multiModelAI } from '../../services/MultiModelAI';
import { Logger } from '../../utils/Logger';

// Visual Node Types
export type VisualNodeType = 
  | 'input'
  | 'output'
  | 'function'
  | 'condition'
  | 'loop'
  | 'variable'
  | 'api-call'
  | 'database'
  | 'ui-component'
  | 'ai-model'
  | 'custom';

// Visual Node Data
export interface VisualNodeData {
  id: string;
  type: VisualNodeType;
  label: string;
  description?: string;
  properties: Record<string, any>;
  code?: string;
  inputs: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
  }>;
  outputs: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  position: { x: number; y: number };
  metadata?: {
    category: string;
    tags: string[];
    documentation?: string;
    examples?: string[];
  };
}

// Visual Workflow
export interface VisualWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: VisualNodeData[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
    data?: any;
  }>;
  variables: Record<string, {
    type: string;
    value: any;
    description?: string;
  }>;
  settings: {
    autoSave: boolean;
    validation: boolean;
    debugging: boolean;
    performance: boolean;
  };
  metadata: {
    created: Date;
    modified: Date;
    version: string;
    author: string;
    tags: string[];
  };
}

// Code Generation Options
export interface CodeGenerationOptions {
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'go' | 'rust';
  framework?: string;
  style: 'functional' | 'object-oriented' | 'mixed';
  includeComments: boolean;
  includeTests: boolean;
  includeDocumentation: boolean;
  optimizePerformance: boolean;
  addErrorHandling: boolean;
}

// Node Templates
const NODE_TEMPLATES: Record<VisualNodeType, Partial<VisualNodeData>> = {
  input: {
    type: 'input',
    label: 'Input',
    description: 'รับข้อมูลจากผู้ใช้หรือระบบภายนอก',
    inputs: [],
    outputs: [{ id: 'output', name: 'Output', type: 'any' }],
    metadata: {
      category: 'Data',
      tags: ['input', 'data', 'user-interface']
    }
  },
  output: {
    type: 'output',
    label: 'Output',
    description: 'แสดงผลหรือส่งข้อมูลออกไป',
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
    outputs: [],
    metadata: {
      category: 'Data',
      tags: ['output', 'display', 'result']
    }
  },
  function: {
    type: 'function',
    label: 'Function',
    description: 'ฟังก์ชันที่ประมวลผลข้อมูล',
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
    outputs: [{ id: 'output', name: 'Output', type: 'any' }],
    metadata: {
      category: 'Logic',
      tags: ['function', 'processing', 'logic']
    }
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    description: 'เงื่อนไขในการตัดสินใจ',
    inputs: [{ id: 'condition', name: 'Condition', type: 'boolean', required: true }],
    outputs: [
      { id: 'true', name: 'True', type: 'any' },
      { id: 'false', name: 'False', type: 'any' }
    ],
    metadata: {
      category: 'Control Flow',
      tags: ['condition', 'if-else', 'decision']
    }
  },
  loop: {
    type: 'loop',
    label: 'Loop',
    description: 'วนซ้ำการทำงาน',
    inputs: [
      { id: 'iterable', name: 'Iterable', type: 'array', required: true },
      { id: 'body', name: 'Body', type: 'function', required: true }
    ],
    outputs: [{ id: 'result', name: 'Result', type: 'array' }],
    metadata: {
      category: 'Control Flow',
      tags: ['loop', 'iteration', 'repeat']
    }
  },
  variable: {
    type: 'variable',
    label: 'Variable',
    description: 'เก็บและจัดการตัวแปร',
    inputs: [{ id: 'value', name: 'Value', type: 'any', required: false }],
    outputs: [{ id: 'value', name: 'Value', type: 'any' }],
    metadata: {
      category: 'Data',
      tags: ['variable', 'storage', 'state']
    }
  },
  'api-call': {
    type: 'api-call',
    label: 'API Call',
    description: 'เรียกใช้ API ภายนอก',
    inputs: [
      { id: 'url', name: 'URL', type: 'string', required: true },
      { id: 'method', name: 'Method', type: 'string', required: true, defaultValue: 'GET' },
      { id: 'headers', name: 'Headers', type: 'object', required: false },
      { id: 'body', name: 'Body', type: 'any', required: false }
    ],
    outputs: [
      { id: 'response', name: 'Response', type: 'object' },
      { id: 'error', name: 'Error', type: 'error' }
    ],
    metadata: {
      category: 'Network',
      tags: ['api', 'http', 'request', 'network']
    }
  },
  database: {
    type: 'database',
    label: 'Database',
    description: 'เชื่อมต่อและจัดการฐานข้อมูล',
    inputs: [
      { id: 'query', name: 'Query', type: 'string', required: true },
      { id: 'params', name: 'Parameters', type: 'object', required: false }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'array' },
      { id: 'error', name: 'Error', type: 'error' }
    ],
    metadata: {
      category: 'Data',
      tags: ['database', 'sql', 'query', 'data']
    }
  },
  'ui-component': {
    type: 'ui-component',
    label: 'UI Component',
    description: 'องค์ประกอบ UI',
    inputs: [
      { id: 'props', name: 'Props', type: 'object', required: false },
      { id: 'children', name: 'Children', type: 'any', required: false }
    ],
    outputs: [
      { id: 'element', name: 'Element', type: 'jsx' },
      { id: 'events', name: 'Events', type: 'object' }
    ],
    metadata: {
      category: 'UI',
      tags: ['ui', 'component', 'react', 'interface']
    }
  },
  'ai-model': {
    type: 'ai-model',
    label: 'AI Model',
    description: 'เรียกใช้โมเดล AI',
    inputs: [
      { id: 'prompt', name: 'Prompt', type: 'string', required: true },
      { id: 'model', name: 'Model', type: 'string', required: true },
      { id: 'parameters', name: 'Parameters', type: 'object', required: false }
    ],
    outputs: [
      { id: 'response', name: 'Response', type: 'string' },
      { id: 'metadata', name: 'Metadata', type: 'object' }
    ],
    metadata: {
      category: 'AI',
      tags: ['ai', 'ml', 'model', 'prediction']
    }
  },
  custom: {
    type: 'custom',
    label: 'Custom Node',
    description: 'โหนดที่กำหนดเอง',
    inputs: [],
    outputs: [],
    metadata: {
      category: 'Custom',
      tags: ['custom', 'user-defined']
    }
  }
};

// Visual Node Component
const VisualNode: React.FC<{
  data: VisualNodeData;
  selected: boolean;
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}> = ({ data, selected, onEdit, onDelete }) => {
  const getNodeColor = (type: VisualNodeType): string => {
    const colors = {
      input: '#4CAF50',
      output: '#FF5722',
      function: '#2196F3',
      condition: '#FF9800',
      loop: '#9C27B0',
      variable: '#607D8B',
      'api-call': '#00BCD4',
      database: '#795548',
      'ui-component': '#E91E63',
      'ai-model': '#3F51B5',
      custom: '#9E9E9E'
    };
    return colors[type] || '#9E9E9E';
  };

  const getNodeIcon = (type: string) => {
    const icons: Record<string, string> = {
      input: 'IN',
      output: 'OUT',
      function: 'FN',
      condition: 'IF',
      loop: 'LOOP',
      variable: 'VAR',
      'api-call': 'API',
      database: 'DB',
      'ui-component': 'UI',
      'ai-model': 'AI',
      custom: 'CUSTOM'
    };
    return icons[type] || 'CUSTOM';
  };

  return (
    <div 
      className={`visual-node ${selected ? 'selected' : ''}`}
      style={{
        background: 'white',
        border: `2px solid ${getNodeColor(data.type)}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '150px',
        boxShadow: selected ? '0 0 10px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
      }}
    >
      {/* Node Header */}
      <div className="node-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '8px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px'
      }}>
        <span style={{ fontSize: '16px', marginRight: '8px' }}>
          {getNodeIcon(data.type)}
        </span>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {data.label}
        </span>
      </div>

      {/* Node Description */}
      {data.description && (
        <div className="node-description" style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '8px'
        }}>
          {data.description}
        </div>
      )}

      {/* Input Handles */}
      {data.inputs.map((input, index) => (
        <div key={input.id} className="input-handle" style={{
          position: 'absolute',
          left: '-8px',
          top: `${40 + index * 20}px`,
          width: '16px',
          height: '16px',
          background: input.required ? '#f44336' : '#4caf50',
          borderRadius: '50%',
          border: '2px solid white'
        }} />
      ))}

      {/* Output Handles */}
      {data.outputs.map((output, index) => (
        <div key={output.id} className="output-handle" style={{
          position: 'absolute',
          right: '-8px',
          top: `${40 + index * 20}px`,
          width: '16px',
          height: '16px',
          background: '#2196f3',
          borderRadius: '50%',
          border: '2px solid white'
        }} />
      ))}

      {/* Node Actions */}
      <div className="node-actions" style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        display: 'flex',
        gap: '4px'
      }}>
        <button
          onClick={() => onEdit(data.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            opacity: 0.7
          }}
          title="Edit Node"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(data.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            opacity: 0.7
          }}
          title="Delete Node"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Node Palette Component
const NodePalette: React.FC<{
  onAddNode: (type: VisualNodeType, position: { x: number; y: number }) => void;
}> = ({ onAddNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Data', 'Logic', 'Control Flow', 'Network', 'UI', 'AI', 'Custom'];

  const filteredNodes = Object.entries(NODE_TEMPLATES).filter(([type, template]) => {
    const matchesSearch = template.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           template.metadata?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const DraggableNode: React.FC<{ type: VisualNodeType; template: Partial<VisualNodeData> }> = 
    ({ type, template }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'visual-node',
      item: { type, template },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });

    return (
      <div
        ref={drag}
        className="draggable-node"
        style={{
          padding: '8px 12px',
          margin: '4px 0',
          background: isDragging ? '#e3f2fd' : '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isDragging ? 0.5 : 1
        }}
        onClick={() => onAddNode(type, { x: 100, y: 100 })}
      >
        <span>{NODE_TEMPLATES[type].metadata?.tags?.[0] === 'input' ? 'IN' :
                NODE_TEMPLATES[type].metadata?.tags?.[0] === 'output' ? 'OUT' : 'FN'}</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{template.label}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>{template.description}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="node-palette" style={{
      width: '250px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Node Palette</h3>
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search nodes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '12px'
        }}
      />

      {/* Category Filter */}
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '12px'
        }}
      >
        {categories.map(category => (
          <option key={category} value={category}>
            {category === 'all' ? 'All Categories' : category}
          </option>
        ))}
      </select>

      {/* Node List */}
      <div className="node-list">
        {filteredNodes.map(([type, template]) => (
          <DraggableNode 
            key={type} 
            type={type as VisualNodeType} 
            template={template} 
          />
        ))}
      </div>
    </div>
  );
};

// Properties Panel Component
const PropertiesPanel: React.FC<{
  selectedNode: VisualNodeData | null;
  onUpdateNode: (nodeId: string, updates: Partial<VisualNodeData>) => void;
}> = ({ selectedNode, onUpdateNode }) => {
  const [properties, setProperties] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setProperties(selectedNode.properties || {});
    }
  }, [selectedNode]);

  const handlePropertyChange = (key: string, value: any) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { properties: newProperties });
    }
  };

  if (!selectedNode) {
    return (
      <div className="properties-panel" style={{
        width: '250px',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Properties</h3>
        <p style={{ color: '#666', fontSize: '12px' }}>Select a node to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="properties-panel" style={{
      width: '250px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Properties</h3>
      
      {/* Node Info */}
      <div className="node-info" style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{selectedNode.label}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{selectedNode.description}</div>
      </div>

      {/* Basic Properties */}
      <div className="basic-properties" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          Label:
        </label>
        <input
          type="text"
          value={selectedNode.label}
          onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '8px'
          }}
        />

        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          Description:
        </label>
        <textarea
          value={selectedNode.description || ''}
          onChange={(e) => onUpdateNode(selectedNode.id, { description: e.target.value })}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            minHeight: '60px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Custom Properties */}
      <div className="custom-properties">
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Custom Properties</h4>
        
        {/* Render properties based on node type */}
        {selectedNode.type === 'function' && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              Function Code:
            </label>
            <textarea
              value={properties.code || ''}
              onChange={(e) => handlePropertyChange('code', e.target.value)}
              placeholder="Enter JavaScript function code..."
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        {selectedNode.type === 'api-call' && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              API URL:
            </label>
            <input
              type="text"
              value={properties.url || ''}
              onChange={(e) => handlePropertyChange('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '8px'
              }}
            />

            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              HTTP Method:
            </label>
            <select
              value={properties.method || 'GET'}
              onChange={(e) => handlePropertyChange('method', e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '8px'
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
        )}

        {selectedNode.type === 'ai-model' && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              AI Model:
            </label>
            <select
              value={properties.model || 'gpt-4'}
              onChange={(e) => handlePropertyChange('model', e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '8px'
              }}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3</option>
              <option value="llama-2">Llama 2</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>

            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              Temperature:
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={properties.temperature || 0.7}
              onChange={(e) => handlePropertyChange('temperature', parseFloat(e.target.value))}
              style={{
                width: '100%',
                marginBottom: '4px'
              }}
            />
            <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
              {properties.temperature || 0.7}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Visual Programming Interface Component
export const VisualProgrammingInterface: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<VisualNodeData | null>(null);
  const [workflow, setWorkflow] = useState<VisualWorkflow | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeGenOptions, setCodeGenOptions] = useState<CodeGenerationOptions>({
    language: 'javascript',
    style: 'functional',
    includeComments: true,
    includeTests: false,
    includeDocumentation: false,
    optimizePerformance: false,
    addErrorHandling: true
  });

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const logger = Logger.getInstance();

  // Drop handler for adding nodes
  const [{ isOver }, drop] = useDrop({
    accept: 'visual-node',
    drop: (item: { type: VisualNodeType; template: Partial<VisualNodeData> }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = {
          x: offset.x - reactFlowBounds.left,
          y: offset.y - reactFlowBounds.top
        };
        addNode(item.type, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  // Add new node
  const addNode = useCallback((type: VisualNodeType, position: { x: number; y: number }) => {
    const template = NODE_TEMPLATES[type];
    const newNodeData: VisualNodeData = {
      id: `node_${Date.now()}`,
      type,
      label: template.label || 'New Node',
      description: template.description,
      properties: {},
      inputs: template.inputs || [],
      outputs: template.outputs || [],
      position,
      metadata: template.metadata
    };

    const newNode: Node = {
      id: newNodeData.id,
      type: 'default',
      position,
      data: newNodeData
    };

    setNodes((nds) => nds.concat(newNode));
    logger.info('Visual node added', { type, nodeId: newNodeData.id });
  }, [setNodes, logger]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as VisualNodeData);
  }, []);

  // Update node
  const updateNode = useCallback((nodeId: string, updates: Partial<VisualNodeData>) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  }, [setNodes, selectedNode]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
    
    logger.info('Visual node deleted', { nodeId });
  }, [setNodes, setEdges, selectedNode, logger]);

  // Handle edge connection
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
    logger.info('Visual nodes connected', { connection: params });
  }, [setEdges, logger]);

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('No nodes to execute!');
      return;
    }

    setIsExecuting(true);
    setExecutionResults(null);

    try {
      // Convert visual workflow to executable format
      const executableWorkflow = {
        nodes: nodes.map(node => node.data),
        edges: edges
      };

      // Use AI to execute the workflow
      const result = await aiCodeAssistant.processRequest({
        id: `workflow_${Date.now()}`,
        type: 'code-generation',
        input: `Execute this visual workflow: ${JSON.stringify(executableWorkflow)}`,
        context: {
          currentFile: {
            path: 'visual-workflow.json',
            content: JSON.stringify(executableWorkflow, null, 2),
            language: 'json',
            cursorPosition: { line: 1, column: 1 }
          },
          project: {
            name: 'Visual Programming Project',
            type: 'web',
            dependencies: [],
            structure: {
              directories: [],
              files: [],
              patterns: {
                testFiles: [],
                configFiles: [],
                sourceFiles: []
              }
            }
          },
          recentFiles: []
        }
      });

      setExecutionResults(result);
      logger.info('Visual workflow executed', { 
        nodeCount: nodes.length, 
        edgeCount: edges.length,
        success: result.success 
      });

    } catch (error) {
      logger.error('Visual workflow execution failed', { error });
      setExecutionResults({ error: 'Execution failed: ' + (error as Error).message });
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, aiCodeAssistant, logger]);

  // Generate code from workflow
  const generateCode = useCallback(async () => {
    if (nodes.length === 0) {
      alert('No nodes to generate code from!');
      return;
    }

    try {
      const workflowData = {
        nodes: nodes.map(node => node.data),
        edges: edges,
        options: codeGenOptions
      };

      const result = await aiCodeAssistant.processRequest({
        id: `codegen_${Date.now()}`,
        type: 'code-generation',
        input: `Generate ${codeGenOptions.language} code from this visual workflow with the following options: ${JSON.stringify(codeGenOptions)}`,
        context: {
          currentFile: {
            path: `workflow.${codeGenOptions.language === 'typescript' ? 'ts' : codeGenOptions.language === 'python' ? 'py' : 'js'}`,
            content: '',
            language: codeGenOptions.language,
            cursorPosition: { line: 1, column: 1 }
          },
          project: {
            name: 'Generated Code Project',
            type: 'web',
            framework: codeGenOptions.framework,
            dependencies: [],
            structure: {
              directories: [],
              files: [],
              patterns: {
                testFiles: [],
                configFiles: [],
                sourceFiles: []
              }
            }
          },
          recentFiles: []
        },
        preferences: {
          codeStyle: codeGenOptions.style,
          includeExplanations: codeGenOptions.includeComments,
          verbosity: 'detailed'
        }
      });

      if (result.success) {
        setGeneratedCode(result.result.primary.content);
        setShowCodePreview(true);
        logger.info('Code generated from visual workflow', { 
          language: codeGenOptions.language,
          nodeCount: nodes.length 
        });
      } else {
        alert('Code generation failed!');
      }

    } catch (error) {
      logger.error('Code generation failed', { error });
      alert('Code generation failed: ' + (error as Error).message);
    }
  }, [nodes, edges, codeGenOptions, aiCodeAssistant, logger]);

  // Save workflow
  const saveWorkflow = useCallback(() => {
    const workflowData: VisualWorkflow = {
      id: `workflow_${Date.now()}`,
      name: 'My Visual Workflow',
      description: 'Generated visual workflow',
      nodes: nodes.map(node => node.data as VisualNodeData),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        data: edge.data
      })),
      variables: {},
      settings: {
        autoSave: true,
        validation: true,
        debugging: true,
        performance: true
      },
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: '1.0.0',
        author: 'Visual Programming User',
        tags: ['visual', 'workflow']
      }
    };

    // Save to localStorage for now (in production, would save to server)
    localStorage.setItem('visual-workflow', JSON.stringify(workflowData));
    setWorkflow(workflowData);
    
    logger.info('Visual workflow saved', { 
      workflowId: workflowData.id,
      nodeCount: nodes.length 
    });
    
    alert('Workflow saved successfully!');
  }, [nodes, edges, logger]);

  // Load workflow
  const loadWorkflow = useCallback(() => {
    try {
      const saved = localStorage.getItem('visual-workflow');
      if (saved) {
        const workflowData: VisualWorkflow = JSON.parse(saved);
        
        // Convert to React Flow format
        const loadedNodes: Node[] = workflowData.nodes.map(nodeData => ({
          id: nodeData.id,
          type: 'default',
          position: nodeData.position,
          data: nodeData
        }));
        
        const loadedEdges = workflowData.edges.map(edgeData => ({
          id: edgeData.id,
          source: edgeData.source,
          target: edgeData.target,
          sourceHandle: edgeData.sourceHandle,
          targetHandle: edgeData.targetHandle,
          type: edgeData.type,
          data: edgeData.data
        }));
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setWorkflow(workflowData);
        
        logger.info('Visual workflow loaded', { 
          workflowId: workflowData.id,
          nodeCount: loadedNodes.length 
        });
        
        alert('Workflow loaded successfully!');
      } else {
        alert('No saved workflow found!');
      }
    } catch (error) {
      logger.error('Failed to load workflow', { error });
      alert('Failed to load workflow!');
    }
  }, [setNodes, setEdges, logger]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="visual-programming-interface" style={{
        display: 'flex',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        {/* Left Panel - Node Palette */}
        <div className="left-panel" style={{
          width: '250px',
          padding: '16px',
          background: '#fafafa',
          borderRight: '1px solid #ddd',
          overflowY: 'auto'
        }}>
          <NodePalette onAddNode={addNode} />
        </div>

        {/* Main Canvas */}
        <div className="main-canvas" style={{
          flex: 1,
          position: 'relative'
        }}>
          {/* Toolbar */}
          <div className="toolbar" style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            zIndex: 10,
            display: 'flex',
            gap: '8px',
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              style={{
                padding: '8px 16px',
                background: isExecuting ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {isExecuting ? 'Executing...' : 'Execute'}
            </button>
            
            <button
              onClick={generateCode}
              style={{
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Generate Code
            </button>
            
            <button
              onClick={saveWorkflow}
              style={{
                padding: '8px 16px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Save
            </button>
            
            <button
              onClick={loadWorkflow}
              style={{
                padding: '8px 16px',
                background: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Load
            </button>
            
            <div style={{ flex: 1 }} />
            
            <select
              value={codeGenOptions.language}
              onChange={(e) => setCodeGenOptions(prev => ({ 
                ...prev, 
                language: e.target.value as CodeGenerationOptions['language'] 
              }))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
          </div>

          {/* React Flow Canvas */}
          <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
            <ReactFlowProvider>
              <ReactFlow
                ref={drop}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={{
                  default: ({ data, selected }) => (
                    <VisualNode 
                      data={data} 
                      selected={selected}
                      onEdit={(nodeId) => setSelectedNode(data)}
                      onDelete={deleteNode}
                    />
                  )
                }}
                fitView
                style={{
                  background: isOver ? '#e8f5e8' : '#fafafa'
                }}
              >
                <Background />
                <Controls />
                <MiniMap 
                  style={{
                    height: 120,
                    background: '#f8f8f8'
                  }}
                  zoomable
                  pannable
                />
                
                {/* Status Panel */}
                <Panel position="bottom-left">
                  <div style={{
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Nodes: {nodes.length} | Edges: {edges.length}
                    {selectedNode && ` | Selected: ${selectedNode.label}`}
                  </div>
                </Panel>
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="right-panel" style={{
          width: '250px',
          padding: '16px',
          background: '#fafafa',
          borderLeft: '1px solid #ddd',
          overflowY: 'auto'
        }}>
          <PropertiesPanel 
            selectedNode={selectedNode}
            onUpdateNode={updateNode}
          />
          
          {/* Execution Results */}
          {executionResults && (
            <div className="execution-results" style={{
              marginTop: '16px',
              padding: '12px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Execution Results</h4>
              <pre style={{
                fontSize: '10px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(executionResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Code Preview Modal */}
        {showCodePreview && (
          <div className="code-preview-modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              width: '80%',
              height: '80%',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0 }}>Generated Code ({codeGenOptions.language})</h3>
                <button
                  onClick={() => setShowCodePreview(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  X
                </button>
              </div>
              <div style={{
                flex: 1,
                padding: '16px',
                overflow: 'auto'
              }}>
                <pre style={{
                  background: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {generatedCode}
                </pre>
              </div>
              <div style={{
                padding: '16px',
                borderTop: '1px solid #ddd',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  style={{
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Copy Code
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([generatedCode], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `workflow.${codeGenOptions.language === 'typescript' ? 'ts' : codeGenOptions.language === 'python' ? 'py' : 'js'}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default VisualProgrammingInterface;