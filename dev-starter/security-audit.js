#!/usr/bin/env node
/**
 * Security Audit System
 * ระบบตรวจสอบและ audit ความปลอดภัยสำหรับ Git Memory MCP Server
 * รวมถึงการสแกนช่องโหว่, ตรวจสอบการตั้งค่า และสร้างรายงานความปลอดภัย
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SecurityAudit {
    constructor(options = {}) {
        this.options = {
            auditPath: options.auditPath || './security-audits',
            maxAuditFiles: options.maxAuditFiles || 50,
            enableFileScanning: options.enableFileScanning !== false,
            enableDependencyCheck: options.enableDependencyCheck !== false,
            enableConfigAudit: options.enableConfigAudit !== false,
            enablePermissionCheck: options.enablePermissionCheck !== false,
            ...options
        };
        
        this.vulnerabilities = [];
        this.warnings = [];
        this.recommendations = [];
        
        // สร้างโฟลเดอร์ audit ถ้ายังไม่มี
        this.ensureAuditDirectory();
    }
    
    /**
     * สร้างโฟลเดอร์ audit
     */
    ensureAuditDirectory() {
        if (!fs.existsSync(this.options.auditPath)) {
            fs.mkdirSync(this.options.auditPath, { recursive: true });
        }
    }
    
    /**
     * เริ่มการ audit ทั้งหมด
     */
    async runFullAudit() {
        console.log('🔍 Starting comprehensive security audit...');
        
        const auditId = this.generateAuditId();
        const startTime = Date.now();
        
        try {
            const results = {
                auditId,
                timestamp: new Date().toISOString(),
                startTime,
                
                // ผลการตรวจสอบต่างๆ
                fileSystemAudit: await this.auditFileSystem(),
                configurationAudit: await this.auditConfiguration(),
                dependencyAudit: await this.auditDependencies(),
                permissionAudit: await this.auditPermissions(),
                networkAudit: await this.auditNetwork(),
                codeAudit: await this.auditCode(),
                
                // สรุปผล
                summary: {
                    vulnerabilities: this.vulnerabilities.length,
                    warnings: this.warnings.length,
                    recommendations: this.recommendations.length,
                    riskLevel: this.calculateRiskLevel()
                },
                
                vulnerabilities: this.vulnerabilities,
                warnings: this.warnings,
                recommendations: this.recommendations,
                
                endTime: Date.now(),
                duration: 0 // จะคำนวณหลังจากเสร็จ
            };
            
            results.duration = results.endTime - results.startTime;
            
            // บันทึกผลการ audit
            await this.saveAuditReport(results);
            
            console.log(`✅ Security audit completed in ${results.duration}ms`);
            console.log(`📊 Found: ${results.summary.vulnerabilities} vulnerabilities, ${results.summary.warnings} warnings`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Security audit failed:', error.message);
            throw error;
        }
    }
    
    /**
     * ตรวจสอบระบบไฟล์
     */
    async auditFileSystem() {
        console.log('🔍 Auditing file system...');
        
        const results = {
            sensitiveFiles: [],
            permissions: [],
            ownership: [],
            timestamps: []
        };
        
        try {
            // ตรวจสอบไฟล์ที่มีข้อมูลลับ
            const sensitivePatterns = [
                /password/i,
                /secret/i,
                /key/i,
                /token/i,
                /credential/i,
                /config/i,
                /\.env/,
                /\.pem$/,
                /\.key$/,
                /\.crt$/
            ];
            
            const files = this.getAllFiles('.');
            
            for (const file of files) {
                // ตรวจสอบชื่อไฟล์
                if (sensitivePatterns.some(pattern => pattern.test(file))) {
                    results.sensitiveFiles.push({
                        file,
                        reason: 'Sensitive filename pattern',
                        risk: 'medium'
                    });
                }
                
                // ตรวจสอบสิทธิ์ไฟล์
                try {
                    const stats = fs.statSync(file);
                    const mode = (stats.mode & parseInt('777', 8)).toString(8);
                    
                    // ตรวจสอบไฟล์ที่เปิดสิทธิ์มากเกินไป
                    if (mode === '777' || mode === '666') {
                        results.permissions.push({
                            file,
                            mode,
                            risk: 'high',
                            issue: 'File has overly permissive permissions'
                        });
                        
                        this.addVulnerability('FILE_PERMISSIONS', {
                            file,
                            mode,
                            description: 'File has dangerous permissions (world writable)'
                        });
                    }
                    
                } catch (error) {
                    // ไฟล์อาจถูกลบหรือไม่สามารถเข้าถึงได้
                }
            }
            
            // ตรวจสอบไฟล์ที่มีเนื้อหาลับ
            await this.scanFileContents(files, results);
            
        } catch (error) {
            this.addWarning('FILE_SYSTEM_AUDIT', {
                error: error.message,
                description: 'Failed to complete file system audit'
            });
        }
        
        return results;
    }
    
    /**
     * สแกนเนื้อหาไฟล์หาข้อมูลลับ
     */
    async scanFileContents(files, results) {
        const secretPatterns = [
            {
                name: 'API Key',
                pattern: /api[_-]?key[\s]*[:=][\s]*['"]?([a-zA-Z0-9]{20,})['"]?/gi,
                risk: 'high'
            },
            {
                name: 'JWT Token',
                pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
                risk: 'high'
            },
            {
                name: 'Password',
                pattern: /password[\s]*[:=][\s]*['"]?([^\s'"]{6,})['"]?/gi,
                risk: 'high'
            },
            {
                name: 'Private Key',
                pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g,
                risk: 'critical'
            },
            {
                name: 'Database URL',
                pattern: /(mongodb|mysql|postgresql|redis):\/\/[^\s]+/gi,
                risk: 'medium'
            },
            {
                name: 'AWS Access Key',
                pattern: /AKIA[0-9A-Z]{16}/g,
                risk: 'critical'
            },
            {
                name: 'GitHub Token',
                pattern: /ghp_[a-zA-Z0-9]{36}/g,
                risk: 'high'
            }
        ];
        
        const textFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.js', '.json', '.env', '.config', '.txt', '.md', '.yml', '.yaml'].includes(ext);
        });
        
        for (const file of textFiles.slice(0, 100)) { // จำกัดจำนวนไฟล์
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                for (const { name, pattern, risk } of secretPatterns) {
                    const matches = content.match(pattern);
                    if (matches) {
                        results.sensitiveFiles.push({
                            file,
                            type: name,
                            matches: matches.length,
                            risk
                        });
                        
                        if (risk === 'critical' || risk === 'high') {
                            this.addVulnerability('EXPOSED_SECRETS', {
                                file,
                                type: name,
                                risk,
                                description: `${name} found in source code`
                            });
                        }
                    }
                }
                
            } catch (error) {
                // ไฟล์อาจเป็น binary หรือไม่สามารถอ่านได้
            }
        }
    }
    
    /**
     * ตรวจสอบการตั้งค่า
     */
    async auditConfiguration() {
        console.log('🔍 Auditing configuration...');
        
        const results = {
            securityConfig: {},
            serverConfig: {},
            environmentVars: {},
            issues: []
        };
        
        try {
            // ตรวจสอบ security config
            if (fs.existsSync('./security-config.json')) {
                const config = JSON.parse(fs.readFileSync('./security-config.json', 'utf8'));
                results.securityConfig = this.analyzeSecurityConfig(config);
            }
            
            // ตรวจสอบ environment variables
            results.environmentVars = this.analyzeEnvironmentVars();
            
            // ตรวจสอบ server configuration
            if (fs.existsSync('./mcp.config.json')) {
                const config = JSON.parse(fs.readFileSync('./mcp.config.json', 'utf8'));
                results.serverConfig = this.analyzeServerConfig(config);
            }
            
        } catch (error) {
            this.addWarning('CONFIG_AUDIT', {
                error: error.message,
                description: 'Failed to audit configuration files'
            });
        }
        
        return results;
    }
    
    /**
     * วิเคราะห์ security config
     */
    analyzeSecurityConfig(config) {
        const analysis = {
            encryption: false,
            jwt: false,
            rateLimit: false,
            cors: false,
            issues: []
        };
        
        // ตรวจสอบ encryption
        if (config.encryption && config.encryption.secretKey) {
            analysis.encryption = true;
            if (config.encryption.secretKey.length < 32) {
                analysis.issues.push('Encryption key is too short');
                this.addVulnerability('WEAK_ENCRYPTION', {
                    description: 'Encryption key length is insufficient'
                });
            }
        } else {
            analysis.issues.push('No encryption configuration found');
            this.addWarning('NO_ENCRYPTION', {
                description: 'Encryption is not configured'
            });
        }
        
        // ตรวจสอบ JWT
        if (config.jwt && config.jwt.secret) {
            analysis.jwt = true;
            if (config.jwt.secret.length < 32) {
                analysis.issues.push('JWT secret is too short');
                this.addVulnerability('WEAK_JWT_SECRET', {
                    description: 'JWT secret is too short for security'
                });
            }
        }
        
        // ตรวจสอบ Rate Limiting
        if (config.rateLimit) {
            analysis.rateLimit = true;
            if (config.rateLimit.maxRequests > 10000) {
                analysis.issues.push('Rate limit might be too high');
                this.addWarning('HIGH_RATE_LIMIT', {
                    description: 'Rate limit allows too many requests'
                });
            }
        }
        
        // ตรวจสอบ CORS
        if (config.cors) {
            analysis.cors = true;
            if (config.cors.allowedOrigins && config.cors.allowedOrigins.includes('*')) {
                analysis.issues.push('CORS allows all origins');
                this.addVulnerability('PERMISSIVE_CORS', {
                    description: 'CORS configuration allows all origins'
                });
            }
        }
        
        return analysis;
    }
    
    /**
     * วิเคราะห์ environment variables
     */
    analyzeEnvironmentVars() {
        const analysis = {
            nodeEnv: process.env.NODE_ENV,
            debug: process.env.DEBUG,
            issues: []
        };
        
        // ตรวจสอบ production settings
        if (process.env.NODE_ENV !== 'production') {
            analysis.issues.push('Not running in production mode');
            this.addWarning('NON_PRODUCTION', {
                description: 'Application is not running in production mode'
            });
        }
        
        // ตรวจสอบ debug mode
        if (process.env.DEBUG === 'true') {
            analysis.issues.push('Debug mode is enabled');
            this.addWarning('DEBUG_ENABLED', {
                description: 'Debug mode should be disabled in production'
            });
        }
        
        return analysis;
    }
    
    /**
     * วิเคราะห์ server config
     */
    analyzeServerConfig(config) {
        const analysis = {
            mcpServers: 0,
            tools: [],
            issues: []
        };
        
        if (config.mcpServers) {
            analysis.mcpServers = Object.keys(config.mcpServers).length;
            
            // ตรวจสอบ server configurations
            for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
                if (serverConfig.command && serverConfig.command.includes('--inspect')) {
                    analysis.issues.push(`Server ${name} has debug mode enabled`);
                    this.addWarning('SERVER_DEBUG', {
                        server: name,
                        description: 'MCP server has debug mode enabled'
                    });
                }
            }
        }
        
        return analysis;
    }
    
    /**
     * ตรวจสอบ dependencies
     */
    async auditDependencies() {
        console.log('🔍 Auditing dependencies...');
        
        const results = {
            vulnerabilities: [],
            outdated: [],
            issues: []
        };
        
        try {
            // ตรวจสอบ package.json
            if (fs.existsSync('./package.json')) {
                const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
                
                // รัน npm audit ถ้ามี
                try {
                    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
                    const audit = JSON.parse(auditResult);
                    
                    if (audit.vulnerabilities) {
                        for (const [pkg, vuln] of Object.entries(audit.vulnerabilities)) {
                            results.vulnerabilities.push({
                                package: pkg,
                                severity: vuln.severity,
                                title: vuln.title,
                                url: vuln.url
                            });
                            
                            if (vuln.severity === 'critical' || vuln.severity === 'high') {
                                this.addVulnerability('DEPENDENCY_VULNERABILITY', {
                                    package: pkg,
                                    severity: vuln.severity,
                                    description: vuln.title
                                });
                            }
                        }
                    }
                    
                } catch (error) {
                    results.issues.push('Failed to run npm audit');
                }
                
                // ตรวจสอบ dependencies ที่เก่า
                try {
                    const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
                    const outdated = JSON.parse(outdatedResult);
                    
                    for (const [pkg, info] of Object.entries(outdated)) {
                        results.outdated.push({
                            package: pkg,
                            current: info.current,
                            wanted: info.wanted,
                            latest: info.latest
                        });
                    }
                    
                } catch (error) {
                    // npm outdated returns non-zero exit code when packages are outdated
                }
            }
            
        } catch (error) {
            this.addWarning('DEPENDENCY_AUDIT', {
                error: error.message,
                description: 'Failed to audit dependencies'
            });
        }
        
        return results;
    }
    
    /**
     * ตรวจสอบสิทธิ์และการเข้าถึง
     */
    async auditPermissions() {
        console.log('🔍 Auditing permissions...');
        
        const results = {
            filePermissions: [],
            processPermissions: [],
            networkPermissions: [],
            issues: []
        };
        
        try {
            // ตรวจสอบสิทธิ์ไฟล์สำคัญ
            const criticalFiles = [
                './security-config.json',
                './mcp.config.json',
                './package.json',
                './.env'
            ];
            
            for (const file of criticalFiles) {
                if (fs.existsSync(file)) {
                    try {
                        const stats = fs.statSync(file);
                        const mode = (stats.mode & parseInt('777', 8)).toString(8);
                        
                        results.filePermissions.push({
                            file,
                            mode,
                            owner: stats.uid,
                            group: stats.gid
                        });
                        
                        // ตรวจสอบสิทธิ์ที่อันตราย
                        if (mode.endsWith('7') || mode.endsWith('6')) {
                            this.addVulnerability('DANGEROUS_FILE_PERMISSIONS', {
                                file,
                                mode,
                                description: 'Critical file has world-writable permissions'
                            });
                        }
                        
                    } catch (error) {
                        results.issues.push(`Failed to check permissions for ${file}`);
                    }
                }
            }
            
        } catch (error) {
            this.addWarning('PERMISSION_AUDIT', {
                error: error.message,
                description: 'Failed to audit permissions'
            });
        }
        
        return results;
    }
    
    /**
     * ตรวจสอบเครือข่าย
     */
    async auditNetwork() {
        console.log('🔍 Auditing network configuration...');
        
        const results = {
            openPorts: [],
            protocols: [],
            issues: []
        };
        
        try {
            // ตรวจสอบพอร์ตที่เปิดอยู่
            const servers = this.findRunningServers();
            results.openPorts = servers;
            
            // ตรวจสอบพอร์ตที่อาจเป็นอันตราย
            for (const server of servers) {
                if (server.port < 1024 && server.port !== 80 && server.port !== 443) {
                    this.addWarning('PRIVILEGED_PORT', {
                        port: server.port,
                        description: 'Service running on privileged port'
                    });
                }
                
                if (server.host === '0.0.0.0') {
                    this.addWarning('OPEN_TO_ALL', {
                        port: server.port,
                        description: 'Service is accessible from all interfaces'
                    });
                }
            }
            
        } catch (error) {
            this.addWarning('NETWORK_AUDIT', {
                error: error.message,
                description: 'Failed to audit network configuration'
            });
        }
        
        return results;
    }
    
    /**
     * ตรวจสอบโค้ด
     */
    async auditCode() {
        console.log('🔍 Auditing code quality and security...');
        
        const results = {
            codeIssues: [],
            securityPatterns: [],
            issues: []
        };
        
        try {
            const jsFiles = this.getAllFiles('.').filter(file => 
                file.endsWith('.js') && !file.includes('node_modules')
            );
            
            for (const file of jsFiles.slice(0, 50)) { // จำกัดจำนวนไฟล์
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // ตรวจสอบ security anti-patterns
                    const securityIssues = this.scanCodeSecurity(content, file);
                    results.securityPatterns.push(...securityIssues);
                    
                } catch (error) {
                    results.issues.push(`Failed to scan ${file}: ${error.message}`);
                }
            }
            
        } catch (error) {
            this.addWarning('CODE_AUDIT', {
                error: error.message,
                description: 'Failed to audit code'
            });
        }
        
        return results;
    }
    
    /**
     * สแกนความปลอดภัยของโค้ด
     */
    scanCodeSecurity(content, file) {
        const issues = [];
        
        const patterns = [
            {
                name: 'eval() usage',
                pattern: /\beval\s*\(/g,
                severity: 'high',
                description: 'Use of eval() can lead to code injection'
            },
            {
                name: 'setTimeout with string',
                pattern: /setTimeout\s*\(\s*['"][^'"]*['"]\s*,/g,
                severity: 'medium',
                description: 'setTimeout with string parameter can be dangerous'
            },
            {
                name: 'innerHTML usage',
                pattern: /\.innerHTML\s*=/g,
                severity: 'medium',
                description: 'innerHTML can lead to XSS if not properly sanitized'
            },
            {
                name: 'document.write usage',
                pattern: /document\.write\s*\(/g,
                severity: 'medium',
                description: 'document.write can be dangerous'
            },
            {
                name: 'Hardcoded credentials',
                pattern: /(password|secret|key)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
                severity: 'high',
                description: 'Hardcoded credentials found'
            },
            {
                name: 'SQL concatenation',
                pattern: /['"]\s*\+\s*[^'"]*\s*\+\s*['"].*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
                severity: 'high',
                description: 'Potential SQL injection vulnerability'
            }
        ];
        
        for (const { name, pattern, severity, description } of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                issues.push({
                    file,
                    issue: name,
                    severity,
                    description,
                    occurrences: matches.length
                });
                
                if (severity === 'high') {
                    this.addVulnerability('CODE_SECURITY', {
                        file,
                        issue: name,
                        description
                    });
                } else {
                    this.addWarning('CODE_QUALITY', {
                        file,
                        issue: name,
                        description
                    });
                }
            }
        }
        
        return issues;
    }
    
    /**
     * หาเซิร์ฟเวอร์ที่กำลังทำงาน
     */
    findRunningServers() {
        const servers = [];
        
        try {
            // อ่านไฟล์ servers.json
            if (fs.existsSync('./servers.json')) {
                const serversData = JSON.parse(fs.readFileSync('./servers.json', 'utf8'));
                
                for (const server of serversData.servers || []) {
                    if (server.status === 'running') {
                        servers.push({
                            name: server.name,
                            port: server.port,
                            host: server.host || 'localhost',
                            category: server.category
                        });
                    }
                }
            }
        } catch (error) {
            // ไม่สามารถอ่านไฟล์ได้
        }
        
        return servers;
    }
    
    /**
     * ดึงไฟล์ทั้งหมดในโฟลเดอร์
     */
    getAllFiles(dir, files = []) {
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                
                // ข้าม node_modules และ .git
                if (item === 'node_modules' || item === '.git' || item.startsWith('.')) {
                    continue;
                }
                
                try {
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        this.getAllFiles(fullPath, files);
                    } else {
                        files.push(fullPath);
                    }
                } catch (error) {
                    // ไฟล์อาจถูกลบหรือไม่สามารถเข้าถึงได้
                }
            }
        } catch (error) {
            // โฟลเดอร์อาจไม่มีหรือไม่สามารถเข้าถึงได้
        }
        
        return files;
    }
    
    /**
     * เพิ่มช่องโหว่
     */
    addVulnerability(type, details) {
        this.vulnerabilities.push({
            id: this.generateId(),
            type,
            severity: details.severity || 'high',
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    
    /**
     * เพิ่มคำเตือน
     */
    addWarning(type, details) {
        this.warnings.push({
            id: this.generateId(),
            type,
            severity: 'medium',
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    
    /**
     * เพิ่มข้อแนะนำ
     */
    addRecommendation(type, details) {
        this.recommendations.push({
            id: this.generateId(),
            type,
            priority: details.priority || 'medium',
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    
    /**
     * คำนวณระดับความเสี่ยง
     */
    calculateRiskLevel() {
        const criticalCount = this.vulnerabilities.filter(v => v.severity === 'critical').length;
        const highCount = this.vulnerabilities.filter(v => v.severity === 'high').length;
        const mediumCount = this.vulnerabilities.filter(v => v.severity === 'medium').length;
        
        if (criticalCount > 0) return 'critical';
        if (highCount > 2) return 'high';
        if (highCount > 0 || mediumCount > 5) return 'medium';
        if (mediumCount > 0 || this.warnings.length > 10) return 'low';
        
        return 'minimal';
    }
    
    /**
     * บันทึกรายงาน audit
     */
    async saveAuditReport(results) {
        const filename = `audit-${results.auditId}-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(this.options.auditPath, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
            console.log(`📄 Audit report saved: ${filepath}`);
            
            // ลบไฟล์ audit เก่าถ้ามีมากเกินไป
            await this.cleanupOldAudits();
            
        } catch (error) {
            console.error('Failed to save audit report:', error.message);
        }
    }
    
    /**
     * ลบไฟล์ audit เก่า
     */
    async cleanupOldAudits() {
        try {
            const files = fs.readdirSync(this.options.auditPath)
                .filter(file => file.startsWith('audit-') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.options.auditPath, file),
                    mtime: fs.statSync(path.join(this.options.auditPath, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);
            
            if (files.length > this.options.maxAuditFiles) {
                const filesToDelete = files.slice(this.options.maxAuditFiles);
                
                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                }
                
                console.log(`🗑️ Cleaned up ${filesToDelete.length} old audit files`);
            }
            
        } catch (error) {
            console.error('Failed to cleanup old audits:', error.message);
        }
    }
    
    /**
     * ดึงรายงาน audit ล่าสุด
     */
    getLatestAuditReport() {
        try {
            const files = fs.readdirSync(this.options.auditPath)
                .filter(file => file.startsWith('audit-') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.options.auditPath, file),
                    mtime: fs.statSync(path.join(this.options.auditPath, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);
            
            if (files.length > 0) {
                const content = fs.readFileSync(files[0].path, 'utf8');
                return JSON.parse(content);
            }
            
        } catch (error) {
            console.error('Failed to get latest audit report:', error.message);
        }
        
        return null;
    }
    
    /**
     * สร้าง ID
     */
    generateId() {
        return crypto.randomBytes(4).toString('hex');
    }
    
    /**
     * สร้าง Audit ID
     */
    generateAuditId() {
        return 'audit_' + crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * ดึงสถิติ audit
     */
    getAuditStats() {
        try {
            const files = fs.readdirSync(this.options.auditPath)
                .filter(file => file.startsWith('audit-') && file.endsWith('.json'));
            
            let totalVulnerabilities = 0;
            let totalWarnings = 0;
            let riskLevels = {};
            
            for (const file of files.slice(0, 10)) { // ตรวจสอบ 10 ไฟล์ล่าสุด
                try {
                    const content = JSON.parse(fs.readFileSync(
                        path.join(this.options.auditPath, file), 'utf8'
                    ));
                    
                    totalVulnerabilities += content.summary?.vulnerabilities || 0;
                    totalWarnings += content.summary?.warnings || 0;
                    
                    const riskLevel = content.summary?.riskLevel || 'unknown';
                    riskLevels[riskLevel] = (riskLevels[riskLevel] || 0) + 1;
                    
                } catch (error) {
                    // ไฟล์อาจเสียหาย
                }
            }
            
            return {
                totalAudits: files.length,
                averageVulnerabilities: files.length > 0 ? totalVulnerabilities / files.length : 0,
                averageWarnings: files.length > 0 ? totalWarnings / files.length : 0,
                riskLevelDistribution: riskLevels
            };
            
        } catch (error) {
            return {
                totalAudits: 0,
                averageVulnerabilities: 0,
                averageWarnings: 0,
                riskLevelDistribution: {}
            };
        }
    }
}

/**
 * Quick security scan
 */
async function quickSecurityScan() {
    const audit = new SecurityAudit();
    
    console.log('🔍 Running quick security scan...');
    
    const results = {
        timestamp: new Date().toISOString(),
        configCheck: await audit.auditConfiguration(),
        permissionCheck: await audit.auditPermissions(),
        summary: {
            vulnerabilities: audit.vulnerabilities.length,
            warnings: audit.warnings.length,
            riskLevel: audit.calculateRiskLevel()
        }
    };
    
    return results;
}

module.exports = {
    SecurityAudit,
    quickSecurityScan
};