#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class BlenderServer {
  private server: Server;
  private blenderProcess: ChildProcess | null = null;
  private blenderPath: string = 'blender'; // Default blender executable path

  constructor() {
    this.server = new Server(
      {
        name: '3d-sco-blender',
        version: '0.6.3',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_cube',
          description: 'Create a cube primitive in Blender',
          inputSchema: {
            type: 'object',
            properties: {
              location: {
                type: 'array',
                items: { type: 'number' },
                description: 'Location coordinates [x, y, z]',
                default: [0, 0, 0]
              },
              size: {
                type: 'number',
                description: 'Size of the cube',
                default: 2
              }
            }
          }
        },
        {
          name: 'create_sphere',
          description: 'Create a sphere primitive in Blender',
          inputSchema: {
            type: 'object',
            properties: {
              location: {
                type: 'array',
                items: { type: 'number' },
                description: 'Location coordinates [x, y, z]',
                default: [0, 0, 0]
              },
              radius: {
                type: 'number',
                description: 'Radius of the sphere',
                default: 1
              },
              subdivisions: {
                type: 'number',
                description: 'Number of subdivisions',
                default: 2
              }
            }
          }
        },
        {
          name: 'create_cylinder',
          description: 'Create a cylinder primitive in Blender',
          inputSchema: {
            type: 'object',
            properties: {
              location: {
                type: 'array',
                items: { type: 'number' },
                description: 'Location coordinates [x, y, z]',
                default: [0, 0, 0]
              },
              radius: {
                type: 'number',
                description: 'Radius of the cylinder',
                default: 1
              },
              depth: {
                type: 'number',
                description: 'Height of the cylinder',
                default: 2
              }
            }
          }
        },
        {
          name: 'delete_object',
          description: 'Delete an object by name',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the object to delete'
              }
            },
            required: ['name']
          }
        },
        {
          name: 'move_object',
          description: 'Move an object to a new location',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the object to move'
              },
              location: {
                type: 'array',
                items: { type: 'number' },
                description: 'New location coordinates [x, y, z]'
              }
            },
            required: ['name', 'location']
          }
        },
        {
          name: 'scale_object',
          description: 'Scale an object',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the object to scale'
              },
              scale: {
                type: 'array',
                items: { type: 'number' },
                description: 'Scale factors [x, y, z]'
              }
            },
            required: ['name', 'scale']
          }
        },
        {
          name: 'rotate_object',
          description: 'Rotate an object',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the object to rotate'
              },
              rotation: {
                type: 'array',
                items: { type: 'number' },
                description: 'Rotation angles in radians [x, y, z]'
              }
            },
            required: ['name', 'rotation']
          }
        },
        {
          name: 'render_scene',
          description: 'Render the current scene',
          inputSchema: {
            type: 'object',
            properties: {
              output_path: {
                type: 'string',
                description: 'Path to save the rendered image',
                default: '/tmp/render.png'
              },
              resolution: {
                type: 'array',
                items: { type: 'number' },
                description: 'Resolution [width, height]',
                default: [1920, 1080]
              }
            }
          }
        },
        {
          name: 'save_blend_file',
          description: 'Save the current scene as a .blend file',
          inputSchema: {
            type: 'object',
            properties: {
              filepath: {
                type: 'string',
                description: 'Path to save the .blend file'
              }
            },
            required: ['filepath']
          }
        },
        {
          name: 'execute_python_script',
          description: 'Execute a Python script in Blender',
          inputSchema: {
            type: 'object',
            properties: {
              script: {
                type: 'string',
                description: 'Python script to execute'
              }
            },
            required: ['script']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_cube':
            return await this.createCube(args?.location as number[], args?.size as number);
          
          case 'create_sphere':
            return await this.createSphere(args?.location as number[], args?.radius as number, args?.subdivisions as number);
          
          case 'create_cylinder':
            return await this.createCylinder(args?.location as number[], args?.radius as number, args?.depth as number);
          
          case 'delete_object':
            return await this.deleteObject(args?.name as string);
          
          case 'move_object':
            return await this.moveObject(args?.name as string, args?.location as number[]);
          
          case 'scale_object':
            return await this.scaleObject(args?.name as string, args?.scale as number[]);
          
          case 'rotate_object':
            return await this.rotateObject(args?.name as string, args?.rotation as number[]);
          
          case 'render_scene':
            return await this.renderScene(args?.output_path as string, args?.resolution as number[]);
          
          case 'save_blend_file':
            return await this.saveBlendFile(args?.filepath as string);
          
          case 'execute_python_script':
            return await this.executePythonScript(args?.script as string);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async executeBlenderScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempScriptPath = join(process.cwd(), 'temp_blender_script.py');
      writeFileSync(tempScriptPath, script);

      const blenderProcess = spawn(this.blenderPath, [
        '--background',
        '--python', tempScriptPath
      ]);

      let output = '';
      let errorOutput = '';

      blenderProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      blenderProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      blenderProcess.on('close', (code) => {
        // Clean up temp file
        try {
          if (existsSync(tempScriptPath)) {
            require('fs').unlinkSync(tempScriptPath);
          }
        } catch (e) {
          // Ignore cleanup errors
        }

        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Blender process failed with code ${code}: ${errorOutput}`));
        }
      });

      blenderProcess.on('error', (error) => {
        reject(new Error(`Failed to start Blender: ${error.message}`));
      });
    });
  }

  private async createCube(location: number[] = [0, 0, 0], size: number = 2) {
    const script = `
import bpy
bpy.ops.mesh.primitive_cube_add(size=${size}, location=(${location.join(', ')}))
print(f"Created cube at location {location} with size {size}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Created cube at location [${location.join(', ')}] with size ${size}`
        }
      ]
    };
  }

  private async createSphere(location: number[] = [0, 0, 0], radius: number = 1, subdivisions: number = 2) {
    const script = `
import bpy
bpy.ops.mesh.primitive_uv_sphere_add(radius=${radius}, location=(${location.join(', ')}), subdivisions=${subdivisions})
print(f"Created sphere at location {location} with radius {radius}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Created sphere at location [${location.join(', ')}] with radius ${radius}`
        }
      ]
    };
  }

  private async createCylinder(location: number[] = [0, 0, 0], radius: number = 1, depth: number = 2) {
    const script = `
import bpy
bpy.ops.mesh.primitive_cylinder_add(radius=${radius}, depth=${depth}, location=(${location.join(', ')}))
print(f"Created cylinder at location {location} with radius {radius} and depth {depth}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Created cylinder at location [${location.join(', ')}] with radius ${radius} and depth ${depth}`
        }
      ]
    };
  }

  private async deleteObject(name: string) {
    const script = `
import bpy
if "${name}" in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects["${name}"], do_unlink=True)
    print(f"Deleted object: ${name}")
else:
    print(f"Object not found: ${name}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Deleted object: ${name}`
        }
      ]
    };
  }

  private async moveObject(name: string, location: number[]) {
    const script = `
import bpy
if "${name}" in bpy.data.objects:
    bpy.data.objects["${name}"].location = (${location.join(', ')})
    print(f"Moved object ${name} to location {location}")
else:
    print(f"Object not found: ${name}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Moved object ${name} to location [${location.join(', ')}]`
        }
      ]
    };
  }

  private async scaleObject(name: string, scale: number[]) {
    const script = `
import bpy
if "${name}" in bpy.data.objects:
    bpy.data.objects["${name}"].scale = (${scale.join(', ')})
    print(f"Scaled object ${name} by {scale}")
else:
    print(f"Object not found: ${name}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Scaled object ${name} by [${scale.join(', ')}]`
        }
      ]
    };
  }

  private async rotateObject(name: string, rotation: number[]) {
    const script = `
import bpy
import mathutils
if "${name}" in bpy.data.objects:
    bpy.data.objects["${name}"].rotation_euler = mathutils.Euler((${rotation.join(', ')}), 'XYZ')
    print(f"Rotated object ${name} by {rotation} radians")
else:
    print(f"Object not found: ${name}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Rotated object ${name} by [${rotation.join(', ')}] radians`
        }
      ]
    };
  }

  private async renderScene(outputPath: string = '/tmp/render.png', resolution: number[] = [1920, 1080]) {
    const script = `
import bpy
bpy.context.scene.render.resolution_x = ${resolution[0]}
bpy.context.scene.render.resolution_y = ${resolution[1]}
bpy.context.scene.render.filepath = "${outputPath}"
bpy.ops.render.render(write_still=True)
print(f"Rendered scene to ${outputPath} at resolution {resolution[0]}x${resolution[1]}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Rendered scene to ${outputPath} at resolution ${resolution[0]}x${resolution[1]}`
        }
      ]
    };
  }

  private async saveBlendFile(filepath: string) {
    const script = `
import bpy
bpy.ops.wm.save_as_mainfile(filepath="${filepath}")
print(f"Saved blend file to ${filepath}")
`;
    
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: `Saved blend file to ${filepath}`
        }
      ]
    };
  }

  private async executePythonScript(script: string) {
    await this.executeBlenderScript(script);
    
    return {
      content: [
        {
          type: 'text',
          text: 'Python script executed successfully'
        }
      ]
    };
  }

  private async cleanup() {
    if (this.blenderProcess) {
      this.blenderProcess.kill();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Blender MCP server running on stdio');
  }
}

const server = new BlenderServer();
server.run().catch(console.error);