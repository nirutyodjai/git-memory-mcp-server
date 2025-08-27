#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class BlenderMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: '3d-sco-blender',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'check_connection',
            description: 'Check Blender installation and connection',
            inputSchema: {
              type: 'object',
              properties: {
                blenderPath: { type: 'string' }
              }
            }
          },
          {
            name: 'create_primitive',
            description: 'Create a primitive 3D object',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['cube', 'sphere', 'cylinder', 'cone', 'plane', 'torus'],
                  default: 'cube'
                },
                location: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 3,
                  maxItems: 3,
                  default: [0, 0, 0]
                },
                scale: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 3,
                  maxItems: 3,
                  default: [1, 1, 1]
                },
                rotation: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 3,
                  maxItems: 3,
                  default: [0, 0, 0]
                }
              },
              required: ['type']
            }
          },
          {
            name: 'render_scene',
            description: 'Render the current Blender scene',
            inputSchema: {
              type: 'object',
              properties: {
                outputPath: { type: 'string' },
                resolution: {
                  type: 'object',
                  properties: {
                    width: { type: 'number', default: 1920 },
                    height: { type: 'number', default: 1080 }
                  }
                },
                samples: { type: 'number', default: 128 },
                engine: {
                  type: 'string',
                  enum: ['CYCLES', 'EEVEE'],
                  default: 'CYCLES'
                }
              }
            }
          },
          {
            name: 'import_model',
            description: 'Import a 3D model file',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: { type: 'string' },
                format: {
                  type: 'string',
                  enum: ['obj', 'fbx', 'gltf', 'dae', 'ply', 'stl'],
                  default: 'obj'
                },
                location: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 3,
                  maxItems: 3,
                  default: [0, 0, 0]
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'export_model',
            description: 'Export the current scene or selected objects',
            inputSchema: {
              type: 'object',
              properties: {
                outputPath: { type: 'string' },
                format: {
                  type: 'string',
                  enum: ['obj', 'fbx', 'gltf', 'dae', 'ply', 'stl'],
                  default: 'obj'
                },
                selectedOnly: { type: 'boolean', default: false },
                includeTextures: { type: 'boolean', default: true }
              },
              required: ['outputPath']
            }
          },
          {
            name: 'apply_material',
            description: 'Apply material to selected objects',
            inputSchema: {
              type: 'object',
              properties: {
                materialName: { type: 'string' },
                properties: {
                  type: 'object',
                  properties: {
                    baseColor: {
                      type: 'array',
                      items: { type: 'number', minimum: 0, maximum: 1 },
                      minItems: 4,
                      maxItems: 4,
                      default: [0.8, 0.8, 0.8, 1.0]
                    },
                    metallic: { type: 'number', minimum: 0, maximum: 1, default: 0.0 },
                    roughness: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
                    emission: {
                      type: 'array',
                      items: { type: 'number', minimum: 0 },
                      minItems: 3,
                      maxItems: 3,
                      default: [0, 0, 0]
                    }
                  }
                }
              },
              required: ['materialName']
            }
          },
          {
            name: 'execute_script',
            description: 'Execute a Python script in Blender',
            inputSchema: {
              type: 'object',
              properties: {
                script: { type: 'string' },
                args: { type: 'object', default: {} }
              },
              required: ['script']
            }
          },
          {
            name: 'get_scene_info',
            description: 'Get information about the current scene',
            inputSchema: {
              type: 'object',
              properties: {
                includeObjects: { type: 'boolean', default: true },
                includeMaterials: { type: 'boolean', default: true },
                includeLights: { type: 'boolean', default: true },
                includeCameras: { type: 'boolean', default: true }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const response = await axios.post(`${this.baseUrl}/api/mcp/blender`, {
          action: name,
          ...args
        }, {
          timeout: 60000, // Blender operations can take longer
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Trae-MCP-Blender/1.0.0'
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: errorMessage,
                action: name,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('3D-SCO Blender MCP server running on stdio');
  }
}

const server = new BlenderMCPServer();
server.run().catch(console.error);