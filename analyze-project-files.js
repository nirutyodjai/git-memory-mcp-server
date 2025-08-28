#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * วิเคราะห์และจัดหมวดหมู่ไฟล์ในโปรเจกต์
 * Project File Analyzer and Categorizer
 */
class ProjectFileAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.analysis = {
            activeFiles: [],
            unusedFiles: [],
            duplicateFiles: [],
            categories: {
                servers: [],
                configs: [],
                scripts: [],
                tests: [],
                docs: [],
                generated: [],
                temp: [],
                system: []
            },
            statistics: {
                totalFiles: 0,
                totalSize: 0,
                byExtension: {},
                byCategory: {}
            }
        };
    }

    /**
     * สแกนไฟล์ทั้งหมดในโปรเจกต์
     */
    async scanAllFiles() {
        const files = [];
        
        const scanDirectory = (dir, relativePath = '') => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relPath = path.join(relativePath, item);
                
                // ข้าม directories ที่ไม่ต้องการ
                if (this.shouldSkipDirectory(item)) {
                    continue;
                }
                
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath, relPath);
                } else {
                    files.push({
                        name: item,
                        path: fullPath,
                        relativePath: relPath,
                        size: stat.size,
                        modified: stat.mtime,
                        extension: path.extname(item).toLowerCase()
                    });
                }
            }
        };
        
        scanDirectory(this.projectRoot);
        return files;
    }

    /**
     * ตรวจสอบว่าควรข้าม directory นี้หรือไม่
     */
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules', '.git', 'dist', 'build', 'coverage',
            '.nyc_output', 'logs', 'tmp', 'temp', '.cache'
        ];
        return skipDirs.includes(dirName);
    }

    /**
     * จัดหมวดหมู่ไฟล์
     */
    categorizeFiles(files) {
        for (const file of files) {
            const category = this.determineFileCategory(file);
            this.analysis.categories[category].push(file);
            
            // อัปเดตสถิติ
            this.analysis.statistics.totalFiles++;
            this.analysis.statistics.totalSize += file.size;
            
            if (!this.analysis.statistics.byExtension[file.extension]) {
                this.analysis.statistics.byExtension[file.extension] = 0;
            }
            this.analysis.statistics.byExtension[file.extension]++;
            
            if (!this.analysis.statistics.byCategory[category]) {
                this.analysis.statistics.byCategory[category] = 0;
            }
            this.analysis.statistics.byCategory[category]++;
        }
    }

    /**
     * กำหนดหมวดหมู่ของไฟล์
     */
    determineFileCategory(file) {
        const fileName = file.name.toLowerCase();
        const filePath = file.relativePath.toLowerCase();
        
        // Server files
        if (fileName.includes('server') || fileName.includes('mcp-') || 
            fileName.includes('security-') || filePath.includes('servers')) {
            return 'servers';
        }
        
        // Configuration files
        if (fileName.includes('config') || fileName.includes('.json') ||
            fileName.includes('package') || fileName.includes('tsconfig') ||
            fileName.includes('jest') || fileName.includes('.env')) {
            return 'configs';
        }
        
        // Script files
        if (fileName.includes('script') || fileName.includes('start-') ||
            fileName.includes('create-') || fileName.includes('deploy') ||
            fileName.includes('restart') || fileName.includes('scale') ||
            fileName.includes('test-') || fileName.includes('quick-') ||
            fileName.includes('load-') || fileName.includes('memory-') ||
            fileName.includes('bridge') || fileName.includes('coordinator')) {
            return 'scripts';
        }
        
        // Test files
        if (fileName.includes('test') || fileName.includes('spec') ||
            filePath.includes('tests') || filePath.includes('__tests__')) {
            return 'tests';
        }
        
        // Documentation files
        if (fileName.includes('readme') || fileName.includes('.md') ||
            filePath.includes('docs') || fileName.includes('changelog') ||
            fileName.includes('contributing')) {
            return 'docs';
        }
        
        // Generated files
        if (filePath.includes('generated') || filePath.includes('dist') ||
            filePath.includes('build') || fileName.includes('.d.ts') ||
            fileName.includes('.map')) {
            return 'generated';
        }
        
        // Temporary files
        if (fileName.includes('temp') || fileName.includes('tmp') ||
            fileName.includes('.log') || fileName.includes('.cache') ||
            fileName.includes('untitled')) {
            return 'temp';
        }
        
        // System files
        if (fileName.startsWith('.') || fileName.includes('git-memory') ||
            filePath.includes('.git-memory') || filePath.includes('.github') ||
            filePath.includes('.trae')) {
            return 'system';
        }
        
        return 'scripts'; // Default category
    }

    /**
     * ตรวจหาไฟล์ที่ไม่ได้ใช้งาน
     */
    findUnusedFiles(files) {
        const potentiallyUnused = [];
        
        for (const file of files) {
            // ตรวจสอบไฟล์ที่อาจไม่ได้ใช้งาน
            if (this.isPotentiallyUnused(file)) {
                potentiallyUnused.push(file);
            }
        }
        
        this.analysis.unusedFiles = potentiallyUnused;
    }

    /**
     * ตรวจสอบว่าไฟล์อาจไม่ได้ใช้งาน
     */
    isPotentiallyUnused(file) {
        const fileName = file.name.toLowerCase();
        
        // ไฟล์ที่มีชื่อบ่งบอกว่าไม่ได้ใช้
        const unusedPatterns = [
            'untitled', 'temp', 'tmp', 'backup', 'old', 'deprecated',
            'unused', 'test-', 'example-', 'sample-'
        ];
        
        for (const pattern of unusedPatterns) {
            if (fileName.includes(pattern)) {
                return true;
            }
        }
        
        // ไฟล์ที่ไม่ได้แก้ไขมานาน (มากกว่า 30 วัน)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (file.modified < thirtyDaysAgo && fileName.includes('test-')) {
            return true;
        }
        
        return false;
    }

    /**
     * ตรวจหาไฟล์ที่ซ้ำกัน
     */
    findDuplicateFiles(files) {
        const sizeGroups = {};
        
        // จัดกลุ่มตามขนาดไฟล์
        for (const file of files) {
            if (!sizeGroups[file.size]) {
                sizeGroups[file.size] = [];
            }
            sizeGroups[file.size].push(file);
        }
        
        // ตรวจสอบไฟล์ที่มีขนาดเท่ากัน
        for (const size in sizeGroups) {
            const group = sizeGroups[size];
            if (group.length > 1) {
                // ตรวจสอบเนื้อหาไฟล์
                const contentGroups = {};
                
                for (const file of group) {
                    try {
                        const content = fs.readFileSync(file.path, 'utf8');
                        const hash = this.simpleHash(content);
                        
                        if (!contentGroups[hash]) {
                            contentGroups[hash] = [];
                        }
                        contentGroups[hash].push(file);
                    } catch (error) {
                        // ข้ามไฟล์ที่อ่านไม่ได้
                    }
                }
                
                // เพิ่มไฟล์ที่ซ้ำกัน
                for (const hash in contentGroups) {
                    const duplicates = contentGroups[hash];
                    if (duplicates.length > 1) {
                        this.analysis.duplicateFiles.push(...duplicates);
                    }
                }
            }
        }
    }

    /**
     * สร้าง hash แบบง่าย
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    /**
     * สร้างรายงานการวิเคราะห์
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.analysis.statistics.totalFiles,
                totalSize: this.formatBytes(this.analysis.statistics.totalSize),
                categories: Object.keys(this.analysis.categories).length,
                unusedFiles: this.analysis.unusedFiles.length,
                duplicateFiles: this.analysis.duplicateFiles.length
            },
            categories: {},
            unusedFiles: this.analysis.unusedFiles.map(f => f.relativePath),
            duplicateFiles: this.analysis.duplicateFiles.map(f => f.relativePath),
            recommendations: this.generateRecommendations()
        };
        
        // สรุปตามหมวดหมู่
        for (const [category, files] of Object.entries(this.analysis.categories)) {
            if (files.length > 0) {
                report.categories[category] = {
                    count: files.length,
                    totalSize: this.formatBytes(files.reduce((sum, f) => sum + f.size, 0)),
                    files: files.map(f => f.relativePath)
                };
            }
        }
        
        return report;
    }

    /**
     * สร้างคำแนะนำ
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.analysis.unusedFiles.length > 0) {
            recommendations.push({
                type: 'cleanup',
                priority: 'medium',
                description: `พบไฟล์ที่อาจไม่ได้ใช้งาน ${this.analysis.unusedFiles.length} ไฟล์`,
                action: 'ควรตรวจสอบและลบไฟล์ที่ไม่จำเป็น'
            });
        }
        
        if (this.analysis.duplicateFiles.length > 0) {
            recommendations.push({
                type: 'deduplication',
                priority: 'high',
                description: `พบไฟล์ที่ซ้ำกัน ${this.analysis.duplicateFiles.length} ไฟล์`,
                action: 'ควรลบไฟล์ที่ซ้ำกันเพื่อประหยัดพื้นที่'
            });
        }
        
        const serverFiles = this.analysis.categories.servers.length;
        if (serverFiles > 100) {
            recommendations.push({
                type: 'organization',
                priority: 'medium',
                description: `มีไฟล์ server จำนวนมาก (${serverFiles} ไฟล์)`,
                action: 'ควรจัดระเบียบไฟล์ server ให้เป็นหมวดหมู่'
            });
        }
        
        return recommendations;
    }

    /**
     * แปลงขนาดไฟล์เป็นรูปแบบที่อ่านง่าย
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * รันการวิเคราะห์ทั้งหมด
     */
    async runAnalysis() {
        console.log('🔍 เริ่มวิเคราะห์ไฟล์โปรเจกต์...');
        console.log('='.repeat(50));
        
        // สแกนไฟล์
        console.log('📁 กำลังสแกนไฟล์...');
        const files = await this.scanAllFiles();
        console.log(`✅ พบไฟล์ทั้งหมด: ${files.length} ไฟล์`);
        
        // จัดหมวดหมู่
        console.log('📊 กำลังจัดหมวดหมู่ไฟล์...');
        this.categorizeFiles(files);
        
        // ตรวจหาไฟล์ที่ไม่ได้ใช้
        console.log('🗑️  กำลังตรวจหาไฟล์ที่ไม่ได้ใช้งาน...');
        this.findUnusedFiles(files);
        
        // ตรวจหาไฟล์ซ้ำ
        console.log('🔄 กำลังตรวจหาไฟล์ที่ซ้ำกัน...');
        this.findDuplicateFiles(files);
        
        // สร้างรายงาน
        console.log('📋 กำลังสร้างรายงาน...');
        const report = this.generateReport();
        
        // บันทึกรายงาน
        const reportPath = path.join(this.projectRoot, 'project-analysis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n✅ การวิเคราะห์เสร็จสิ้น!');
        console.log(`📄 รายงานถูกบันทึกที่: ${reportPath}`);
        
        this.displaySummary(report);
        
        return report;
    }

    /**
     * แสดงสรุปผลการวิเคราะห์
     */
    displaySummary(report) {
        console.log('\n📊 สรุปผลการวิเคราะห์');
        console.log('='.repeat(50));
        console.log(`📁 ไฟล์ทั้งหมด: ${report.summary.totalFiles}`);
        console.log(`💾 ขนาดรวม: ${report.summary.totalSize}`);
        console.log(`📂 หมวดหมู่: ${report.summary.categories}`);
        console.log(`🗑️  ไฟล์ที่ไม่ได้ใช้: ${report.summary.unusedFiles}`);
        console.log(`🔄 ไฟล์ซ้ำ: ${report.summary.duplicateFiles}`);
        
        console.log('\n📂 รายละเอียดตามหมวดหมู่:');
        for (const [category, data] of Object.entries(report.categories)) {
            console.log(`  ${category}: ${data.count} ไฟล์ (${data.totalSize})`);
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 คำแนะนำ:');
            report.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
                console.log(`     ${rec.action}`);
            });
        }
    }
}

// รันการวิเคราะห์
if (require.main === module) {
    const analyzer = new ProjectFileAnalyzer();
    analyzer.runAnalysis().catch(console.error);
}

module.exports = ProjectFileAnalyzer;