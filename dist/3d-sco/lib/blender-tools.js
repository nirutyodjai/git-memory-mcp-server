"use strict";
/**
 * Blender MCP Tools Integration
 * This file provides utilities for Blender 3D operations and asset management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.polyhavnTools = exports.blenderTools = exports.PolyhavnTools = exports.BlenderTools = void 0;
const mcp_tools_1 = require("./mcp-tools");
// Blender Tools Class
class BlenderTools {
    constructor() {
        this.blenderConnected = false;
        this.blenderPort = 8080;
    }
    static getInstance() {
        if (!BlenderTools.instance) {
            BlenderTools.instance = new BlenderTools();
        }
        return BlenderTools.instance;
    }
    // Check if Blender is connected
    async checkBlenderConnection() {
        try {
            const response = await fetch(`http://localhost:${this.blenderPort}/api/status`);
            this.blenderConnected = response.ok;
            return this.blenderConnected;
        }
        catch (error) {
            this.blenderConnected = false;
            return false;
        }
    }
    // Execute Python code in Blender
    async executeBlenderCode(code) {
        if (!this.blenderConnected) {
            return {
                success: false,
                error: 'Blender is not connected. Please ensure Blender is running with the API server.'
            };
        }
        try {
            const response = await fetch(`http://localhost:${this.blenderPort}/api/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });
            const result = await response.json();
            return {
                success: response.ok,
                result: result.result,
                error: result.error
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    // Get scene information
    async getSceneInfo() {
        const code = `
import bpy
import json

scene = bpy.context.scene
result = {
    "name": scene.name,
    "objects": [],
    "cameras": [],
    "lights": [],
    "materials": [],
    "collections": [col.name for col in bpy.data.collections],
    "frameRange": {
        "start": scene.frame_start,
        "end": scene.frame_end,
        "current": scene.frame_current
    },
    "renderSettings": {
        "engine": scene.render.engine,
        "resolution": {
            "x": scene.render.resolution_x,
            "y": scene.render.resolution_y
        },
        "samples": getattr(scene.cycles, 'samples', 128) if hasattr(scene, 'cycles') else 128
    }
}

# Get objects
for obj in bpy.data.objects:
    obj_data = {
        "name": obj.name,
        "type": obj.type,
        "location": list(obj.location),
        "rotation": list(obj.rotation_euler),
        "scale": list(obj.scale),
        "visible": obj.visible_get(),
        "selected": obj.select_get(),
        "parent": obj.parent.name if obj.parent else None,
        "children": [child.name for child in obj.children],
        "materials": [mat.name for mat in obj.data.materials] if hasattr(obj.data, 'materials') else []
    }
    
    if obj.type == 'CAMERA':
        result["cameras"].append({
            **obj_data,
            "lens": obj.data.lens,
            "clipStart": obj.data.clip_start,
            "clipEnd": obj.data.clip_end,
            "type": obj.data.type
        })
    elif obj.type == 'LIGHT':
        result["lights"].append({
            **obj_data,
            "energy": obj.data.energy,
            "color": list(obj.data.color)
        })
    else:
        result["objects"].append(obj_data)

# Get materials
for mat in bpy.data.materials:
    mat_data = {
        "name": mat.name,
        "nodes": [],
        "baseColor": [1, 1, 1, 1],
        "metallic": 0,
        "roughness": 0.5,
        "emission": [0, 0, 0],
        "alpha": 1
    }
    
    if mat.use_nodes and mat.node_tree:
        principled = None
        for node in mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                principled = node
                break
        
        if principled:
            mat_data["baseColor"] = list(principled.inputs['Base Color'].default_value)
            mat_data["metallic"] = principled.inputs['Metallic'].default_value
            mat_data["roughness"] = principled.inputs['Roughness'].default_value
            mat_data["alpha"] = principled.inputs['Alpha'].default_value
            if 'Emission' in principled.inputs:
                mat_data["emission"] = list(principled.inputs['Emission'].default_value[:3])
    
    result["materials"].append(mat_data)

print(json.dumps(result))
`;
        const response = await this.executeBlenderCode(code);
        if (response.success && response.result) {
            try {
                return JSON.parse(response.result);
            }
            catch (error) {
                return null;
            }
        }
        return null;
    }
    // Get object information
    async getObjectInfo(objectName) {
        const code = `
import bpy
import json

obj = bpy.data.objects.get("${objectName}")
if obj:
    result = {
        "name": obj.name,
        "type": obj.type,
        "location": list(obj.location),
        "rotation": list(obj.rotation_euler),
        "scale": list(obj.scale),
        "visible": obj.visible_get(),
        "selected": obj.select_get(),
        "parent": obj.parent.name if obj.parent else None,
        "children": [child.name for child in obj.children],
        "materials": [mat.name for mat in obj.data.materials] if hasattr(obj.data, 'materials') else []
    }
    print(json.dumps(result))
else:
    print("Object not found")
`;
        const response = await this.executeBlenderCode(code);
        if (response.success && response.result && response.result !== "Object not found") {
            try {
                return JSON.parse(response.result);
            }
            catch (error) {
                return null;
            }
        }
        return null;
    }
    // Take viewport screenshot
    async getViewportScreenshot(maxSize = 800) {
        const code = `
import bpy
import os
import tempfile
import base64

# Create temporary file
temp_dir = tempfile.gettempdir()
temp_file = os.path.join(temp_dir, "blender_screenshot.png")

# Set render settings for screenshot
scene = bpy.context.scene
original_filepath = scene.render.filepath
original_resolution_x = scene.render.resolution_x
original_resolution_y = scene.render.resolution_y

# Calculate new resolution maintaining aspect ratio
aspect_ratio = original_resolution_x / original_resolution_y
if aspect_ratio > 1:
    new_width = min(${maxSize}, original_resolution_x)
    new_height = int(new_width / aspect_ratio)
else:
    new_height = min(${maxSize}, original_resolution_y)
    new_width = int(new_height * aspect_ratio)

scene.render.filepath = temp_file
scene.render.resolution_x = new_width
scene.render.resolution_y = new_height

# Render current viewport
bpy.ops.render.opengl(write_still=True)

# Restore original settings
scene.render.filepath = original_filepath
scene.render.resolution_x = original_resolution_x
scene.render.resolution_y = original_resolution_y

# Read and encode image
if os.path.exists(temp_file):
    with open(temp_file, "rb") as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    os.remove(temp_file)
    print(f"data:image/png;base64,{image_data}")
else:
    print("Screenshot failed")
`;
        const response = await this.executeBlenderCode(code);
        if (response.success && response.result && !response.result.includes("Screenshot failed")) {
            return response.result;
        }
        return null;
    }
}
exports.BlenderTools = BlenderTools;
// Polyhaven Integration
class PolyhavnTools {
    constructor() {
        this.baseUrl = 'https://api.polyhaven.com';
    }
    static getInstance() {
        if (!PolyhavnTools.instance) {
            PolyhavnTools.instance = new PolyhavnTools();
        }
        return PolyhavnTools.instance;
    }
    async getCategories(assetType = 'hdris') {
        try {
            const response = await mcp_tools_1.webFetcher.fetchJSON(`${this.baseUrl}/categories/${assetType}`);
            return Object.keys(response);
        }
        catch (error) {
            console.error('Failed to fetch Polyhaven categories:', error);
            return [];
        }
    }
    async searchAssets(assetType = 'all', categories) {
        try {
            let url = `${this.baseUrl}/assets`;
            const params = new URLSearchParams();
            if (assetType !== 'all') {
                params.append('type', assetType);
            }
            if (categories) {
                params.append('categories', categories);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const response = await mcp_tools_1.webFetcher.fetchJSON(url);
            return Object.entries(response).map(([id, data]) => ({
                id,
                name: data.name || id,
                type: data.type,
                categories: data.categories || [],
                tags: data.tags || [],
                description: data.description,
                author: data.author,
                license: data.license
            }));
        }
        catch (error) {
            console.error('Failed to search Polyhaven assets:', error);
            return [];
        }
    }
    async getAssetDownloadUrl(assetId, assetType, resolution = '1k', format) {
        try {
            const response = await mcp_tools_1.webFetcher.fetchJSON(`${this.baseUrl}/files/${assetId}`);
            if (response[resolution]) {
                const resolutionData = response[resolution];
                if (format && resolutionData[format]) {
                    return resolutionData[format].url;
                }
                // Return first available format
                const firstFormat = Object.keys(resolutionData)[0];
                return resolutionData[firstFormat]?.url || null;
            }
            return null;
        }
        catch (error) {
            console.error('Failed to get Polyhaven download URL:', error);
            return null;
        }
    }
}
exports.PolyhavnTools = PolyhavnTools;
// Export singleton instances
exports.blenderTools = BlenderTools.getInstance();
exports.polyhavnTools = PolyhavnTools.getInstance();
