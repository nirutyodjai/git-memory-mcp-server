import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

// Types for Code Intelligence API
export interface CodeSnippet {
    id: string;
    type: 'FUNCTION_CALL' | 'CODE_PATTERN' | 'IMPORT_STATEMENT' | 'CLASS_DEFINITION' | 'VARIABLE_DECLARATION';
    name: string;
    template: string;
    parameters: SnippetParameter[];
    language: string;
    tags: string[];
    frequency: number;
    score: number;
    contexts: SnippetContext[];
    examples: SnippetExample[];
    metadata: Record<string, any>;
}

export interface SnippetParameter {
    name: string;
    type: string;
    description?: string;
    defaultValue?: string;
    required: boolean;
}

export interface SnippetContext {
    filePattern: string;
    lineContext: string[];
    imports: string[];
    scope: 'global' | 'class' | 'function' | 'block';
}

export interface SnippetExample {
    code: string;
    description: string;
    language: string;
}

export interface FunctionPattern {
    id: string;
    name: string;
    description: string;
    category: string;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    steps: PatternStep[];
    constraints: PatternConstraint[];
    metrics: PatternMetric[];
    examples: PatternExample[];
    version: string;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    successRate: number;
    aiMetadata: {
        preferredModels: string[];
        contextRequirements: string[];
        estimatedTokens: number;
        complexity: number;
    };
}

export interface PatternStep {
    order: number;
    action: string;
    description: string;
    code?: string;
    validation?: string;
}

export interface PatternConstraint {
    type: 'LANGUAGE' | 'FRAMEWORK' | 'VERSION' | 'DEPENDENCY' | 'CUSTOM';
    value: string;
    description: string;
}

export interface PatternMetric {
    name: string;
    description: string;
    expectedValue: string;
    actualValue?: string;
    status?: 'PASS' | 'FAIL' | 'UNKNOWN';
}

export interface PatternExample {
    title: string;
    description: string;
    beforeCode: string;
    afterCode: string;
    language: string;
    context: string;
}

export interface AnalysisResult {
    fileAnalysis: FileAnalysis[];
    snippets: CodeSnippet[];
    patterns: FunctionPattern[];
    hotspots: CodeHotspot[];
    recommendations: string[];
}

export interface FileAnalysis {
    filePath: string;
    language: string;
    elements: CodeElement[];
    dependencies: string[];
    complexity: number;
    maintainabilityIndex: number;
    lastModified: Date;
}

export interface CodeElement {
    type: 'CLASS' | 'FUNCTION' | 'VARIABLE' | 'IMPORT' | 'INTERFACE' | 'TYPE';
    name: string;
    startLine: number;
    endLine