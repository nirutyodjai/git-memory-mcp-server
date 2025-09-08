const fs = require('fs');
const path = require('path');

const tenantsDir = path.join(__dirname, '..', '..', 'tenants');

function tenantMiddleware(req, res, next) {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
        return res.status(400).json({ message: 'X-Tenant-ID header is required' });
    }

    const tenantConfigFile = path.join(tenantsDir, `${tenantId}.json`);

    fs.readFile(tenantConfigFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        try {
            req.tenant = JSON.parse(data);
            next();
        } catch (parseError) {
            return res.status(500).json({ message: 'Error parsing tenant configuration' });
        }
    });
}

module.exports = tenantMiddleware;