/**
 * Blender MCP Tools Integration
 * This file provides utilities for Blender 3D operations and asset management
 */
export interface BlenderSceneInfo {
    name: string;
    objects: BlenderObject[];
    cameras: BlenderCamera[];
    lights: BlenderLight[];
    materials: BlenderMaterial[];
    collections: string[];
    frameRange: {
        start: number;
        end: number;
        current: number;
    };
    renderSettings: {
        engine: string;
        resolution: {
            x: number;
            y: number;
        };
        samples: number;
    };
}
export interface BlenderObject {
    name: string;
    type: string;
    location: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    visible: boolean;
    selected: boolean;
    parent?: string;
    children: string[];
    materials: string[];
}
export interface BlenderCamera {
    name: string;
    location: [number, number, number];
    rotation: [number, number, number];
    lens: number;
    clipStart: number;
    clipEnd: number;
    type: 'PERSP' | 'ORTHO' | 'PANO';
}
export interface BlenderLight {
    name: string;
    type: 'SUN' | 'POINT' | 'SPOT' | 'AREA';
    location: [number, number, number];
    rotation: [number, number, number];
    energy: number;
    color: [number, number, number];
}
export interface BlenderMaterial {
    name: string;
    nodes: any[];
    baseColor: [number, number, number, number];
    metallic: number;
    roughness: number;
    emission: [number, number, number];
    alpha: number;
}
export interface PolyhavenAsset {
    id: string;
    name: string;
    type: 'hdris' | 'textures' | 'models';
    categories: string[];
    tags: string[];
    downloadUrl?: string;
    previewUrl?: string;
    description?: string;
    author?: string;
    license?: string;
    resolutions?: string[];
    formats?: string[];
}
export interface SketchfabModel {
    uid: string;
    name: string;
    description: string;
    author: {
        username: string;
        displayName: string;
        profileUrl: string;
    };
    thumbnails: {
        small: string;
        medium: string;
        large: string;
    };
    tags: string[];
    categories: string[];
    downloadable: boolean;
    animated: boolean;
    vertexCount: number;
    faceCount: number;
    license: string;
    createdAt: string;
    updatedAt: string;
}
export interface Hyper3DRequest {
    textPrompt: string;
    bboxCondition?: [number, number, number];
    style?: string;
    quality?: 'draft' | 'standard' | 'high';
}
export interface Hyper3DResult {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    modelUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
    error?: string;
}
export declare class BlenderTools {
    private static instance;
    private blenderConnected;
    private blenderPort;
    private constructor();
    static getInstance(): BlenderTools;
    checkBlenderConnection(): Promise<boolean>;
    executeBlenderCode(code: string): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    getSceneInfo(): Promise<BlenderSceneInfo | null>;
    getObjectInfo(objectName: string): Promise<BlenderObject | null>;
    getViewportScreenshot(maxSize?: number): Promise<string | null>;
}
export declare class PolyhavnTools {
    private static instance;
    private baseUrl;
    private constructor();
    static getInstance(): PolyhavnTools;
    getCategories(assetType?: 'hdris' | 'textures' | 'models' | 'all'): Promise<string[]>;
    searchAssets(assetType?: 'hdris' | 'textures' | 'models' | 'all', categories?: string): Promise<PolyhavnAsset[]>;
    getAssetDownloadUrl(assetId: string, assetType: 'hdris' | 'textures' | 'models', resolution?: string, format?: string): Promise<string | null>;
}
export declare const blenderTools: BlenderTools;
export declare const polyhavnTools: PolyhavnTools;
//# sourceMappingURL=blender-tools.d.ts.map