"use strict";
/**
 * Sequential Thinking MCP Tools
 * This file provides utilities for structured thinking and problem-solving processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequentialThinking = exports.SequentialThinking = exports.THINKING_TEMPLATES = void 0;
// Pre-defined thinking templates
exports.THINKING_TEMPLATES = [
    {
        id: 'problem-solving',
        name: 'Problem Solving Process',
        description: 'Systematic approach to solving complex problems',
        category: 'general',
        steps: [
            {
                title: 'Problem Definition',
                description: 'Clearly define and understand the problem',
                metadata: { type: 'analysis' }
            },
            {
                title: 'Information Gathering',
                description: 'Collect relevant data and information',
                metadata: { type: 'research' }
            },
            {
                title: 'Generate Solutions',
                description: 'Brainstorm and generate potential solutions',
                metadata: { type: 'creative' }
            },
            {
                title: 'Evaluate Options',
                description: 'Analyze and compare different solutions',
                metadata: { type: 'analysis' }
            },
            {
                title: 'Select Solution',
                description: 'Choose the best solution based on evaluation',
                metadata: { type: 'decision' }
            },
            {
                title: 'Implementation Plan',
                description: 'Create a detailed plan for implementing the solution',
                metadata: { type: 'planning' }
            },
            {
                title: 'Execute and Monitor',
                description: 'Implement the solution and monitor progress',
                metadata: { type: 'execution' }
            }
        ]
    },
    {
        id: 'design-thinking',
        name: 'Design Thinking Process',
        description: 'Human-centered approach to innovation and design',
        category: 'design',
        steps: [
            {
                title: 'Empathize',
                description: 'Understand the user and their needs',
                metadata: { type: 'research' }
            },
            {
                title: 'Define',
                description: 'Define the problem based on user insights',
                metadata: { type: 'analysis' }
            },
            {
                title: 'Ideate',
                description: 'Generate creative solutions and ideas',
                metadata: { type: 'creative' }
            },
            {
                title: 'Prototype',
                description: 'Build prototypes to test ideas',
                metadata: { type: 'development' }
            },
            {
                title: 'Test',
                description: 'Test prototypes with users and gather feedback',
                metadata: { type: 'validation' }
            }
        ]
    },
    {
        id: 'software-development',
        name: 'Software Development Process',
        description: 'Structured approach to software development',
        category: 'development',
        steps: [
            {
                title: 'Requirements Analysis',
                description: 'Gather and analyze project requirements',
                metadata: { type: 'analysis' }
            },
            {
                title: 'System Design',
                description: 'Design system architecture and components',
                metadata: { type: 'design' }
            },
            {
                title: 'Implementation',
                description: 'Write code and implement features',
                metadata: { type: 'development' }
            },
            {
                title: 'Testing',
                description: 'Test the software for bugs and issues',
                metadata: { type: 'validation' }
            },
            {
                title: 'Deployment',
                description: 'Deploy the software to production',
                metadata: { type: 'deployment' }
            },
            {
                title: 'Maintenance',
                description: 'Maintain and update the software',
                metadata: { type: 'maintenance' }
            }
        ]
    },
    {
        id: 'research-process',
        name: 'Research Process',
        description: 'Systematic approach to conducting research',
        category: 'research',
        steps: [
            {
                title: 'Research Question',
                description: 'Define the research question or hypothesis',
                metadata: { type: 'planning' }
            },
            {
                title: 'Literature Review',
                description: 'Review existing literature and research',
                metadata: { type: 'research' }
            },
            {
                title: 'Methodology',
                description: 'Choose appropriate research methods',
                metadata: { type: 'planning' }
            },
            {
                title: 'Data Collection',
                description: 'Collect data using chosen methods',
                metadata: { type: 'research' }
            },
            {
                title: 'Data Analysis',
                description: 'Analyze collected data',
                metadata: { type: 'analysis' }
            },
            {
                title: 'Interpretation',
                description: 'Interpret results and draw conclusions',
                metadata: { type: 'analysis' }
            },
            {
                title: 'Documentation',
                description: 'Document findings and write report',
                metadata: { type: 'documentation' }
            }
        ]
    },
    {
        id: 'decision-making',
        name: 'Decision Making Process',
        description: 'Structured approach to making important decisions',
        category: 'decision',
        steps: [
            {
                title: 'Identify Decision',
                description: 'Clearly identify the decision to be made',
                metadata: { type: 'analysis' }
            },
            {
                title: 'Gather Information',
                description: 'Collect relevant information and data',
                metadata: { type: 'research' }
            },
            {
                title: 'Identify Alternatives',
                description: 'List all possible alternatives',
                metadata: { type: 'creative' }
            },
            {
                title: 'Evaluate Alternatives',
                description: 'Assess pros and cons of each alternative',
                metadata: { type: 'analysis' }
            },
            {
                title: 'Make Decision',
                description: 'Choose the best alternative',
                metadata: { type: 'decision' }
            },
            {
                title: 'Implement Decision',
                description: 'Put the decision into action',
                metadata: { type: 'execution' }
            },
            {
                title: 'Evaluate Results',
                description: 'Monitor and evaluate the outcome',
                metadata: { type: 'validation' }
            }
        ]
    }
];
// Sequential Thinking Manager
class SequentialThinking {
    constructor() {
        this.processes = new Map();
        this.templates = new Map();
        // Load default templates
        exports.THINKING_TEMPLATES.forEach(template => {
            this.templates.set(template.id, template);
        });
    }
    static getInstance() {
        if (!SequentialThinking.instance) {
            SequentialThinking.instance = new SequentialThinking();
        }
        return SequentialThinking.instance;
    }
    // Template management
    getTemplates(category) {
        const templates = Array.from(this.templates.values());
        return category ? templates.filter(t => t.category === category) : templates;
    }
    getTemplate(id) {
        return this.templates.get(id);
    }
    addTemplate(template) {
        this.templates.set(template.id, template);
    }
    // Process management
    createProcess(title, description, templateId, customSteps) {
        const processId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let steps = [];
        if (templateId) {
            const template = this.templates.get(templateId);
            if (template) {
                steps = template.steps.map((step, index) => ({
                    id: `step_${index + 1}`,
                    ...step,
                    status: 'pending'
                }));
            }
        }
        else if (customSteps) {
            steps = customSteps.map((step, index) => ({
                id: `step_${index + 1}`,
                ...step,
                status: 'pending'
            }));
        }
        const process = {
            id: processId,
            title,
            description,
            steps,
            status: 'pending',
            metadata: {
                templateId,
                createdAt: new Date().toISOString()
            }
        };
        this.processes.set(processId, process);
        return process;
    }
    getProcess(id) {
        return this.processes.get(id);
    }
    getAllProcesses() {
        return Array.from(this.processes.values());
    }
    deleteProcess(id) {
        return this.processes.delete(id);
    }
    // Step execution
    startProcess(processId) {
        const process = this.processes.get(processId);
        if (!process)
            return null;
        process.status = 'processing';
        process.startTime = new Date();
        // Start first step if available
        if (process.steps.length > 0) {
            process.currentStep = process.steps[0].id;
            this.startStep(processId, process.steps[0].id);
        }
        return process;
    }
    startStep(processId, stepId) {
        const process = this.processes.get(processId);
        if (!process)
            return null;
        const step = process.steps.find(s => s.id === stepId);
        if (!step)
            return null;
        // Check dependencies
        if (step.dependencies) {
            const uncompletedDeps = step.dependencies.filter(depId => {
                const depStep = process.steps.find(s => s.id === depId);
                return !depStep || depStep.status !== 'completed';
            });
            if (uncompletedDeps.length > 0) {
                throw new Error(`Cannot start step ${stepId}. Uncompleted dependencies: ${uncompletedDeps.join(', ')}`);
            }
        }
        step.status = 'processing';
        step.startTime = new Date();
        process.currentStep = stepId;
        return step;
    }
    completeStep(processId, stepId, output, metadata) {
        const process = this.processes.get(processId);
        if (!process)
            return null;
        const step = process.steps.find(s => s.id === stepId);
        if (!step)
            return null;
        step.status = 'completed';
        step.endTime = new Date();
        step.output = output;
        if (step.startTime) {
            step.duration = step.endTime.getTime() - step.startTime.getTime();
        }
        if (metadata) {
            step.metadata = { ...step.metadata, ...metadata };
        }
        // Check if all steps are completed
        const allCompleted = process.steps.every(s => s.status === 'completed');
        if (allCompleted) {
            this.completeProcess(processId);
        }
        else {
            // Find next step to start
            const nextStep = this.findNextStep(process);
            if (nextStep) {
                this.startStep(processId, nextStep.id);
            }
        }
        return step;
    }
    failStep(processId, stepId, error, metadata) {
        const process = this.processes.get(processId);
        if (!process)
            return null;
        const step = process.steps.find(s => s.id === stepId);
        if (!step)
            return null;
        step.status = 'failed';
        step.endTime = new Date();
        if (step.startTime) {
            step.duration = step.endTime.getTime() - step.startTime.getTime();
        }
        step.metadata = {
            ...step.metadata,
            error,
            ...metadata
        };
        // Fail the entire process
        process.status = 'failed';
        process.endTime = new Date();
        if (process.startTime) {
            process.totalDuration = process.endTime.getTime() - process.startTime.getTime();
        }
        return step;
    }
    completeProcess(processId) {
        const process = this.processes.get(processId);
        if (!process)
            return;
        process.status = 'completed';
        process.endTime = new Date();
        if (process.startTime) {
            process.totalDuration = process.endTime.getTime() - process.startTime.getTime();
        }
        // Collect all outputs
        process.result = {
            steps: process.steps.map(step => ({
                id: step.id,
                title: step.title,
                output: step.output,
                duration: step.duration
            })),
            totalDuration: process.totalDuration,
            completedAt: process.endTime.toISOString()
        };
    }
    findNextStep(process) {
        return process.steps.find(step => {
            if (step.status !== 'pending')
                return false;
            // Check if all dependencies are completed
            if (step.dependencies) {
                return step.dependencies.every(depId => {
                    const depStep = process.steps.find(s => s.id === depId);
                    return depStep && depStep.status === 'completed';
                });
            }
            return true;
        }) || null;
    }
    // Utility methods
    getProcessProgress(processId) {
        const process = this.processes.get(processId);
        if (!process)
            return null;
        const total = process.steps.length;
        const completed = process.steps.filter(s => s.status === 'completed').length;
        const failed = process.steps.filter(s => s.status === 'failed').length;
        const processing = process.steps.filter(s => s.status === 'processing').length;
        const pending = process.steps.filter(s => s.status === 'pending').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
            total,
            completed,
            failed,
            processing,
            pending,
            percentage
        };
    }
    exportProcess(processId) {
        const process = this.processes.get(processId);
        if (!process)
            return null;
        return JSON.stringify(process, null, 2);
    }
    importProcess(processData) {
        try {
            const process = JSON.parse(processData);
            this.processes.set(process.id, process);
            return process;
        }
        catch (error) {
            return null;
        }
    }
}
exports.SequentialThinking = SequentialThinking;
// Export singleton instance
exports.sequentialThinking = SequentialThinking.getInstance();
//# sourceMappingURL=sequential-thinking.js.map