const professionalServices = {
    consulting: {
        title: 'Consulting Services',
        description: 'Expert guidance to optimize your MCP server architecture, performance, and security.',
        offerings: [
            { id: 'arch-design', name: 'Architecture Design', rate: '200-500/hour' },
            { id: 'perf-opt', name: 'Performance Optimization', rate: '200-500/hour' },
            { id: 'sec-assess', name: 'Security Assessment', rate: '200-500/hour' },
            { id: 'mig-plan', name: 'Migration Planning', rate: '200-500/hour' },
        ]
    },
    customDev: {
        title: 'Custom Development',
        description: 'Bespoke solutions tailored to your unique business needs.',
        offerings: [
            { id: 'bespoke-mcp', name: 'Bespoke MCP Servers', rate: '50K-200K/project' },
            { id: 'integ-dev', name: 'Integration Development', rate: '50K-200K/project' },
            { id: 'custom-feat', name: 'Custom Features', rate: '50K-200K/project' },
            { id: 'ent-solutions', name: 'Enterprise Solutions', rate: '50K-200K/project' },
        ]
    },
    training: {
        title: 'Training Programs',
        description: 'Empower your team with in-depth knowledge and best practices.',
        offerings: [
            { id: 'dev-workshop', name: 'Developer Workshops', rate: '2K-10K/program' },
            { id: 'admin-training', name: 'Administrator Training', rate: '2K-10K/program' },
            { id: 'best-prac', name: 'Best Practices Sessions', rate: '2K-10K/program' },
            { id: 'cert-prog', name: 'Certification Programs', rate: '2K-10K/program' },
        ]
    }
};

class ProfessionalServicesService {
    async getOfferings() {
        return professionalServices;
    }

    async getOfferingByCategory(category) {
        return professionalServices[category];
    }

    async requestService(serviceRequest) {
        // Mock implementation for service request
        console.log('Service request received:', serviceRequest);
        return { id: `req_${Date.now()}`, ...serviceRequest, status: 'received' };
    }
}

module.exports = new ProfessionalServicesService();