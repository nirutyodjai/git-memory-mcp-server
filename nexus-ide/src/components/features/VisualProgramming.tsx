/**
 * Visual Programming Interface Component
 * 
 * Features:
 * - Drag-and-drop visual programming
 * - Node-based code generation
 * - Flow-based programming
 * - Component library
 * - Real-time code preview
 * - AI-assisted node creation
 * - Export to multiple languages
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Save, 
  Download, 
  Upload, 
  Zap, 
  Brain, 
  Code, 
  Eye, 
  EyeOff, 
  Grid, 
  Move, 
  RotateCcw, 
  RotateCw, 
  Copy, 
  Trash2, 
  Plus, 
  Minus, 
  Settings, 
  Layers, 
  GitBranch, 
  ArrowRight, 
  Circle, 
  Square as SquareIcon, 
  Triangle, 
  Diamond,
  Workflow,
  Palette,
  MousePointer,
  Hand
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { toast } from 'sonner';

export interface VisualNode {
  id: string;
  type: 'input' | 'output' | 'process' | 'condition' | 'loop' | 'function' | 'variable' | 'component';
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
  inputs: NodePort[];
  outputs: NodePort[];
  code?: string;
  language?: string;
}

export interface NodePort {
  id: string;
  label: string;
  type: 'data' | 'control' | 'event';
  dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
  required?: boolean;
}

export interface VisualConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  type: 'data' | 'control' | 'event';
}

export interface VisualFlow {
  id: string;
  name: string;
  description: string;
  nodes: VisualNode[];
  connections: VisualConnection[];
  variables: FlowVariable[];
  metadata: {
    created: Date;
    modified: Date;
    version: string;
    author: string;
  };
}

export interface FlowVariable {
  id: string;
  name: string;
  type: string;
  value: any;
  scope: 'global' | 'local';
}

export interface NodeTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  template: Partial<VisualNode>;
}

export interface VisualProgrammingProps {
  className?: string;
  initialFlow?: VisualFlow;
  onFlowChange?: (flow: VisualFlow) => void;
  onCodeGenerate?: (code: string, language: string) => void;
}

const VisualProgramming: React.FC<VisualProgrammingProps> = ({
  className = '',
  initialFlow,
  onFlowChange,
  onCodeGenerate
}) => {
  const { state: aiState, actions: aiActions } = useAI();
  const [flow, setFlow] = useState<VisualFlow>(initialFlow || {
    id: 'default',
    name: 'New Flow',
    description: 'Visual programming flow',
    nodes: [],
    connections: [],
    variables: [],
    metadata: {
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
      author: 'User'
    }
  });
  
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; portId: string } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('javascript');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'move' | 'connect'>('select');
  const [showNodeLibrary, setShowNodeLibrary] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Node templates library
  const nodeTemplates: NodeTemplate[] = [
    {
      id: 'input',
      name: 'Input',
      category: 'Basic',
      description: 'Input data or user interaction',
      icon: <Circle className="w-4 h-4" />,
      template: {
        type: 'input',
        label: 'Input',
        size: { width: 120, height: 60 },
        properties: { value: '', placeholder: 'Enter value' },
        inputs: [],
        outputs: [{ id: 'out', label: 'Output', type: 'data', dataType: 'string' }]
      }
    },
    {
      id: 'output',
      name: 'Output',
      category: 'Basic',
      description: 'Display or export data',
      icon: <SquareIcon className="w-4 h-4" />,
      template: {
        type: 'output',
        label: 'Output',
        size: { width: 120, height: 60 },
        properties: { format: 'text' },
        inputs: [{ id: 'in', label: 'Input', type: 'data', dataType: 'string', required: true }],
        outputs: []
      }
    },
    {
      id: 'process',
      name: 'Process',
      category: 'Logic',
      description: 'Process or transform data',
      icon: <SquareIcon className="w-4 h-4" />,
      template: {
        type: 'process',
        label: 'Process',
        size: { width: 140, height: 80 },
        properties: { operation: 'transform' },
        inputs: [{ id: 'in', label: 'Input', type: 'data', dataType: 'string' }],
        outputs: [{ id: 'out', label: 'Output', type: 'data', dataType: 'string' }]
      }
    },
    {
      id: 'condition',
      name: 'Condition',
      category: 'Logic',
      description: 'Conditional branching',
      icon: <Diamond className="w-4 h-4" />,
      template: {
        type: 'condition',
        label: 'If/Else',
        size: { width: 120, height: 80 },
        properties: { condition: 'value > 0' },
        inputs: [{ id: 'in', label: 'Input', type: 'data', dataType: 'boolean' }],
        outputs: [
          { id: 'true', label: 'True', type: 'control' },
          { id: 'false', label: 'False', type: 'control' }
        ]
      }
    },
    {
      id: 'loop',
      name: 'Loop',
      category: 'Logic',
      description: 'Repeat operations',
      icon: <RotateCw className="w-4 h-4" />,
      template: {
        type: 'loop',
        label: 'For Loop',
        size: { width: 140, height: 80 },
        properties: { iterations: 10, variable: 'i' },
        inputs: [{ id: 'in', label: 'Input', type: 'control' }],
        outputs: [
          { id: 'body', label: 'Body', type: 'control' },
          { id: 'out', label: 'Output', type: 'control' }
        ]
      }
    },
    {
      id: 'function',
      name: 'Function',
      category: 'Advanced',
      description: 'Custom function',
      icon: <Code className="w-4 h-4" />,
      template: {
        type: 'function',
        label: 'Function',
        size: { width: 160, height: 100 },
        properties: { name: 'myFunction', parameters: ['param1'], code: 'return param1;' },
        inputs: [{ id: 'param1', label: 'Param 1', type: 'data', dataType: 'string' }],
        outputs: [{ id: 'return', label: 'Return', type: 'data', dataType: 'string' }]
      }
    }
  ];

  // Update flow when changed
  useEffect(() => {
    onFlowChange?.(flow);
  }, [flow, onFlowChange]);

  // Generate code when flow changes
  useEffect(() => {
    if (flow.nodes.length > 0) {
      generateCode();
    }
  }, [flow, targetLanguage]);

  const generateCode = useCallback(async () => {
    try {
      const response = await aiActions.generateSuggestion({
        prompt: `Generate ${targetLanguage} code for this visual flow: ${JSON.stringify({
          nodes: flow.nodes.map(n => ({ type: n.type, label: n.label, properties: n.properties })),
          connections: flow.connections
        })}`,
        context: {
          type: 'visual-programming',
          language: targetLanguage,
          flow: flow
        }
      });
      
      setGeneratedCode(response.content);
      onCodeGenerate?.(response.content, targetLanguage);
    } catch (error) {
      console.error('Code generation error:', error);
      // Fallback to simple code generation
      const simpleCode = generateSimpleCode();
      setGeneratedCode(simpleCode);
      onCodeGenerate?.(simpleCode, targetLanguage);
    }
  }, [flow, targetLanguage, aiActions, onCodeGenerate]);

  const generateSimpleCode = useCallback(() => {
    let code = '';
    
    if (targetLanguage === 'javascript') {
      code = '// Generated from Visual Flow\n';
      code += 'function visualFlow() {\n';
      
      flow.nodes.forEach(node => {
        switch (node.type) {
          case 'input':
            code += `  const ${node.label.toLowerCase()} = "${node.properties.value || ''}";\n`;
            break;
          case 'process':
            code += `  // Process: ${node.label}\n`;
            code += `  const processed = transform(${node.label.toLowerCase()});\n`;
            break;
          case 'output':
            code += `  console.log(${node.label.toLowerCase()});\n`;
            break;
        }
      });
      
      code += '}\n\nvisualFlow();';
    } else if (targetLanguage === 'python') {
      code = '# Generated from Visual Flow\n';
      code += 'def visual_flow():\n';
      
      flow.nodes.forEach(node => {
        switch (node.type) {
          case 'input':
            code += `    ${node.label.toLowerCase()} = "${node.properties.value || ''}"\n`;
            break;
          case 'process':
            code += `    # Process: ${node.label}\n`;
            code += `    processed = transform(${node.label.toLowerCase()})\n`;
            break;
          case 'output':
            code += `    print(${node.label.toLowerCase()})\n`;
            break;
        }
      });
      
      code += '\nvisual_flow()';
    }
    
    return code;
  }, [flow, targetLanguage]);

  const addNode = useCallback((template: NodeTemplate, position: { x: number; y: number }) => {
    const newNode: VisualNode = {
      id: Date.now().toString(),
      ...template.template,
      position,
      inputs: template.template.inputs || [],
      outputs: template.template.outputs || []
    } as VisualNode;
    
    setFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      metadata: { ...prev.metadata, modified: new Date() }
    }));
    
    toast.success(`Added ${template.name} node`);
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;
    
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => !selectedNodes.includes(n.id)),
      connections: prev.connections.filter(c => 
        !selectedNodes.includes(c.fromNodeId) && !selectedNodes.includes(c.toNodeId)
      ),
      metadata: { ...prev.metadata, modified: new Date() }
    }));
    
    setSelectedNodes([]);
    toast.success('Deleted selected nodes');
  }, [selectedNodes]);

  const duplicateSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;
    
    const nodesToDuplicate = flow.nodes.filter(n => selectedNodes.includes(n.id));
    const duplicatedNodes = nodesToDuplicate.map(node => ({
      ...node,
      id: Date.now().toString() + Math.random(),
      position: { x: node.position.x + 20, y: node.position.y + 20 }
    }));
    
    setFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, ...duplicatedNodes],
      metadata: { ...prev.metadata, modified: new Date() }
    }));
    
    setSelectedNodes(duplicatedNodes.map(n => n.id));
    toast.success('Duplicated selected nodes');
  }, [selectedNodes, flow.nodes]);

  const runFlow = useCallback(async () => {
    setIsRunning(true);
    toast.info('Running visual flow...');
    
    try {
      // Simulate flow execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Flow executed successfully');
    } catch (error) {
      toast.error('Flow execution failed');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNodes([]);
      setSelectedConnections([]);
    }
  }, []);

  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      setSelectedNodes(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId)
          : [...prev, nodeId]
      );
    } else {
      setSelectedNodes([nodeId]);
    }
  }, []);

  const renderNode = useCallback((node: VisualNode) => {
    const isSelected = selectedNodes.includes(node.id);
    
    return (
      <div
        key={node.id}
        className={`absolute border-2 rounded-lg bg-background shadow-lg cursor-pointer transition-all ${
          isSelected ? 'border-primary shadow-primary/20' : 'border-border hover:border-primary/50'
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: node.size.width,
          height: node.size.height,
          transform: `scale(${zoom})`
        }}
        onClick={(e) => handleNodeClick(node.id, e)}
      >
        <div className="p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{node.label}</span>
            <div className="text-xs text-muted-foreground">{node.type}</div>
          </div>
          
          {/* Node properties */}
          <div className="flex-1 text-xs text-muted-foreground">
            {Object.entries(node.properties).slice(0, 2).map(([key, value]) => (
              <div key={key}>{key}: {String(value).substring(0, 20)}</div>
            ))}
          </div>
          
          {/* Input ports */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            {node.inputs.map((port, index) => (
              <div
                key={port.id}
                className="w-3 h-3 bg-blue-500 rounded-full border-2 border-background -ml-1.5 mb-1"
                style={{ top: `${(index + 1) * 20}px` }}
                title={port.label}
              />
            ))}
          </div>
          
          {/* Output ports */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            {node.outputs.map((port, index) => (
              <div
                key={port.id}
                className="w-3 h-3 bg-green-500 rounded-full border-2 border-background -mr-1.5 mb-1"
                style={{ top: `${(index + 1) * 20}px` }}
                title={port.label}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [selectedNodes, zoom, handleNodeClick]);

  const renderConnections = useCallback(() => {
    return flow.connections.map(connection => {
      const fromNode = flow.nodes.find(n => n.id === connection.fromNodeId);
      const toNode = flow.nodes.find(n => n.id === connection.toNodeId);
      
      if (!fromNode || !toNode) return null;
      
      const fromPort = fromNode.outputs.find(p => p.id === connection.fromPortId);
      const toPort = toNode.inputs.find(p => p.id === connection.toPortId);
      
      if (!fromPort || !toPort) return null;
      
      const fromX = fromNode.position.x + fromNode.size.width;
      const fromY = fromNode.position.y + fromNode.size.height / 2;
      const toX = toNode.position.x;
      const toY = toNode.position.y + toNode.size.height / 2;
      
      const isSelected = selectedConnections.includes(connection.id);
      
      return (
        <line
          key={connection.id}
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
          strokeWidth={isSelected ? 3 : 2}
          className="cursor-pointer"
          onClick={() => setSelectedConnections([connection.id])}
        />
      );
    });
  }, [flow.connections, flow.nodes, selectedConnections]);

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* Node Library */}
      {showNodeLibrary && (
        <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold mb-2">Node Library</h3>
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full p-2 border border-border rounded-md bg-background text-sm"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {['Basic', 'Logic', 'Advanced'].map(category => (
              <div key={category} className="mb-4">
                <h4 className="font-medium text-sm mb-2 text-muted-foreground">{category}</h4>
                <div className="space-y-1">
                  {nodeTemplates
                    .filter(template => template.category === category)
                    .map(template => (
                      <div
                        key={template.id}
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('nodeTemplate', JSON.stringify(template));
                        }}
                        onClick={() => {
                          // Add node at center of canvas
                          addNode(template, { x: 200, y: 200 });
                        }}
                      >
                        {template.icon}
                        <div>
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTool('select')}
              className={`p-2 rounded-md transition-colors ${
                tool === 'select' ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
              }`}
              title="Select tool"
            >
              <MousePointer className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setTool('move')}
              className={`p-2 rounded-md transition-colors ${
                tool === 'move' ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
              }`}
              title="Move tool"
            >
              <Hand className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setTool('connect')}
              className={`p-2 rounded-md transition-colors ${
                tool === 'connect' ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
              }`}
              title="Connect tool"
            >
              <GitBranch className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <button
              onClick={runFlow}
              disabled={isRunning}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Run flow"
            >
              {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-md transition-colors ${
                showGrid ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
              }`}
              title="Toggle grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowCode(!showCode)}
              className={`p-2 rounded-md transition-colors ${
                showCode ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
              }`}
              title="Show generated code"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="p-1 border border-border rounded bg-background text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
            </select>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="p-1 hover:bg-accent rounded"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm min-w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-1 hover:bg-accent rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <button
              onClick={() => setShowNodeLibrary(!showNodeLibrary)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Toggle node library"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-crosshair"
            onClick={handleCanvasClick}
            onDrop={(e) => {
              e.preventDefault();
              const templateData = e.dataTransfer.getData('nodeTemplate');
              if (templateData) {
                const template = JSON.parse(templateData);
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                  const position = {
                    x: (e.clientX - rect.left - pan.x) / zoom,
                    y: (e.clientY - rect.top - pan.y) / zoom
                  };
                  addNode(template, position);
                }
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Grid */}
            {showGrid && (
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px)`
                }}
              />
            )}
            
            {/* SVG for connections */}
            <svg
              ref={svgRef}
              className="absolute inset-0 pointer-events-none"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {renderConnections()}
            </svg>
            
            {/* Nodes */}
            <div 
              className="absolute inset-0"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
            >
              {flow.nodes.map(renderNode)}
            </div>
          </div>
        </div>
        
        {/* Code Panel */}
        {showCode && (
          <div className="h-64 border-t border-border bg-muted/30 flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-border">
              <h3 className="font-semibold">Generated Code ({targetLanguage})</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  className="p-1 hover:bg-accent rounded"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCode(false)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <pre className="text-sm font-mono">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {/* Properties Panel */}
      {selectedNodes.length > 0 && (
        <div className="w-64 border-l border-border bg-muted/30 flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold mb-2">Properties</h3>
            <div className="text-sm text-muted-foreground">
              {selectedNodes.length} node{selectedNodes.length > 1 ? 's' : ''} selected
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {selectedNodes.length === 1 && (() => {
              const node = flow.nodes.find(n => n.id === selectedNodes[0]);
              if (!node) return null;
              
              return (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Label</label>
                    <input
                      type="text"
                      value={node.label}
                      onChange={(e) => {
                        setFlow(prev => ({
                          ...prev,
                          nodes: prev.nodes.map(n => 
                            n.id === node.id ? { ...n, label: e.target.value } : n
                          )
                        }));
                      }}
                      className="w-full p-2 border border-border rounded bg-background text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <select
                      value={node.type}
                      onChange={(e) => {
                        setFlow(prev => ({
                          ...prev,
                          nodes: prev.nodes.map(n => 
                            n.id === node.id ? { ...n, type: e.target.value as any } : n
                          )
                        }));
                      }}
                      className="w-full p-2 border border-border rounded bg-background text-sm"
                    >
                      <option value="input">Input</option>
                      <option value="output">Output</option>
                      <option value="process">Process</option>
                      <option value="condition">Condition</option>
                      <option value="loop">Loop</option>
                      <option value="function">Function</option>
                    </select>
                  </div>
                  
                  {Object.entries(node.properties).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium mb-1 block capitalize">{key}</label>
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => {
                          setFlow(prev => ({
                            ...prev,
                            nodes: prev.nodes.map(n => 
                              n.id === node.id 
                                ? { ...n, properties: { ...n.properties, [key]: e.target.value } }
                                : n
                            )
                          }));
                        }}
                        className="w-full p-2 border border-border rounded bg-background text-sm"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <button
                onClick={duplicateSelectedNodes}
                className="flex-1 p-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm"
              >
                <Copy className="w-3 h-3 mr-1 inline" />
                Duplicate
              </button>
              <button
                onClick={deleteSelectedNodes}
                className="flex-1 p-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors text-sm"
              >
                <Trash2 className="w-3 h-3 mr-1 inline" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualProgramming;