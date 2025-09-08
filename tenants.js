/**
 * Simple Tenant Manager for API Gateway
 * จัดการ tenant information สำหรับ API Gateway
 */

class TenantManager {
    constructor() {
        this.tenants = new Map();
        
        // Default tenant
        this.tenants.set('default', {
            id: 'default',
            name: 'Default Tenant',
            subscriptionId: 'free',
            upstreams: [],
            active: true,
            createdAt: new Date()
        });
    }
    
    /**
     * Get tenant by ID
     * @param {string} tenantId 
     * @returns {Object|null}
     */
    getTenant(tenantId) {
        return this.tenants.get(tenantId) || this.tenants.get('default');
    }
    
    /**
     * Add new tenant
     * @param {string} tenantId 
     * @param {Object} tenantData 
     */
    addTenant(tenantId, tenantData) {
        this.tenants.set(tenantId, {
            id: tenantId,
            ...tenantData,
            createdAt: new Date()
        });
    }
    
    /**
     * Remove tenant
     * @param {string} tenantId 
     */
    removeTenant(tenantId) {
        if (tenantId !== 'default') {
            this.tenants.delete(tenantId);
        }
    }
    
    /**
     * Get all tenants
     * @returns {Array}
     */
    getAllTenants() {
        return Array.from(this.tenants.values());
    }
}

// Export singleton instance
module.exports = new TenantManager();