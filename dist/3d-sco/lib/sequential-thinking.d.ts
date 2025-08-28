/**
 * Sequential Thinking MCP Tools
 * This file provides utilities for structured thinking and problem-solving processes
 */
export interface ThinkingStep {
    id: string;
    title: string;
    description: string;
    input?: any;
    output?: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    dependencies?: string[];
    metadata?: Record<string, any>;
}
export interface ThinkingProcess {
    id: string;
    title: string;
    description: string;
    steps: ThinkingStep[];
    currentStep?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    totalDuration?: number;
    result?: any;
    metadata?: Record<string, any>;
}
export interface ThinkingTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    steps: Omit<ThinkingStep, 'id' | 'status' | 'startTime' | 'endTime' | 'duration'>[];
    metadata?: Record<string, any>;
}
export declare const THINKING_TEMPLATES: ThinkingTemplate[];
export declare class SequentialThinking {
    private static instance;
    private processes;
    private templates;
    private constructor();
    static getInstance(): SequentialThinking;
    getTemplates(category?: string): ThinkingTemplate[];
    getTemplate(id: string): ThinkingTemplate | undefined;
    addTemplate(template: ThinkingTemplate): void;
    createProcess(title: string, description: string, templateId?: string, customSteps?: Omit<ThinkingStep, 'id' | 'status' | 'startTime' | 'endTime' | 'duration'>[]): ThinkingProcess;
    getProcess(id: string): ThinkingProcess | undefined;
    getAllProcesses(): ThinkingProcess[];
    deleteProcess(id: string): boolean;
    startProcess(processId: string): ThinkingProcess | null;
    startStep(processId: string, stepId: string): ThinkingStep | null;
    completeStep(processId: string, stepId: string, output?: any, metadata?: Record<string, any>): ThinkingStep | null;
    failStep(processId: string, stepId: string, error: string, metadata?: Record<string, any>): ThinkingStep | null;
    private completeProcess;
    private findNextStep;
    getProcessProgress(processId: string): {
        total: number;
        completed: number;
        failed: number;
        processing: number;
        pending: number;
        percentage: number;
    } | null;
    exportProcess(processId: string): string | null;
    importProcess(processData: string): ThinkingProcess | null;
}
export declare const sequentialThinking: SequentialThinking;
//# sourceMappingURL=sequential-thinking.d.ts.map