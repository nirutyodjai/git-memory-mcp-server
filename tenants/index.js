const fs = require('fs');
const path = require('path');

class TenantManager {
    constructor() {
        this.tenants = new Map();
        this.loadTenants();
        this.watchTenants();
    }

    loadTenants() {
        const tenantsDir = path.join(__dirname);
        try {
            if (fs.existsSync(tenantsDir)) {
                const tenantFiles = fs.readdirSync(tenantsDir).filter(file => file.endsWith('.json'));
                const newTenants = new Map();
                for (const tenantFile of tenantFiles) {
                    const tenantId = path.basename(tenantFile, '.json');
                    const configPath = path.join(tenantsDir, tenantFile);
                    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    newTenants.set(tenantId, config);
                }

                this.tenants = newTenants;
                console.log('Tenants reloaded');
            }
        } catch (error) {
            console.error('Failed to load tenants:', error.message);
        }
    }

    watchTenants() {
        const tenantsDir = path.join(__dirname);
        try {
            if (fs.existsSync(tenantsDir)) {
                fs.watch(tenantsDir, (eventType, filename) => {
                    if (filename && filename.endsWith('.json')) {
                        console.log(`Detected change in ${filename}, reloading tenants...`);
                        this.loadTenants();
                    }
                });
            }
        } catch (error) {
            console.error('Failed to watch tenants directory:', error.message);
        }
    }

    getTenant(tenantId) {
        return this.tenants.get(tenantId);
    }

    getAllTenants() {
        return Array.from(this.tenants.keys());
    }
}

module.exports = new TenantManager();