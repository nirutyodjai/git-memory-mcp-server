const EventEmitter = require('events');

/**
 * @class SaaSService
 * @description Manages the SaaS platform, including tenant provisioning and management.
 * 
 * @emits tenant-created - When a new tenant is created.
 * @emits tenant-updated - When a tenant's settings are updated.
 */
class SaaSService extends EventEmitter {
    constructor() {
        super();
        this.tenants = new Map();
    }

    /**
     * @description Provision a new tenant on the SaaS platform.
     * @param {string} tenantName - The name of the new tenant.
     * @param {Object} adminUser - The admin user for the new tenant.
     * @returns {Promise<Object>} The details of the newly created tenant.
     */
    async provisionTenant(tenantName, adminUser) {
        if (this.tenants.has(tenantName)) {
            throw new Error('Tenant with this name already exists.');
        }

        const tenantId = `tenant_${Date.now()}`;
        const newTenant = {
            id: tenantId,
            name: tenantName,
            admin: adminUser,
            createdAt: new Date(),
            status: 'active',
            // Mock infrastructure details
            infrastructure: {
                region: 'us-east-1',
                clusterId: `cluster_${tenantId}`,
            },
        };

        this.tenants.set(tenantName, newTenant);
        this.emit('tenant-created', newTenant);
        console.log(`New tenant provisioned: ${tenantName}`)
        return newTenant;
    }

    /**
     * @description Get details for a specific tenant.
     * @param {string} tenantId - The ID of the tenant.
     * @returns {Promise<Object|null>} The tenant details or null if not found.
     */
    async getTenant(tenantId) {
        for (const tenant of this.tenants.values()) {
            if (tenant.id === tenantId) {
                return tenant;
            }
        }
        return null;
    }

    /**
     * @description De-provision a tenant from the SaaS platform.
     * @param {string} tenantId - The ID of the tenant to de-provision.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    async deprovisionTenant(tenantId) {
        let tenantName = null;
        for (const [name, tenant] of this.tenants.entries()) {
            if (tenant.id === tenantId) {
                tenantName = name;
                break;
            }
        }

        if (tenantName) {
            this.tenants.delete(tenantName);
            this.emit('tenant-deleted', { tenantId });
            console.log(`Tenant de-provisioned: ${tenantName}`);
            return true;
        }
        return false;
    }
}

module.exports = new SaaSService();