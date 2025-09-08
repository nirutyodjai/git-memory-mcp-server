#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * การวิเคราะห์ไฟล์แบบเร็ว
 * Quick File Analysis
 */
class QuickFileAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.nyc_output', 'logs', 'tmp', 'temp', '.cache'];
        this.categories = {
            servers: [],
            configs: [],
            scripts: [],
            tests: [],
            docs: [],
            temp: [],
            system: []
        };
    }

    /**
     * สแกนไฟล์แบบเร็ว
     */
    quickScan() {
        const files = [];
        const items = fs.readdirSync(this.projectRoot);
        
        for (const item of items) {
            const fullPath = path.join(this.projectRoot, item);
            
            try {
                const stat = fs.statSync(fullPath);
                
                if (stat.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    files.push({
                        name: item,
                        path: fullPath,
                        size: stat.size,
                        modified: stat.mtime,
                        extension: ext,
                        category: this.categorizeFile(item)
                    });
                }
            } catch (error) {
                // ข้ามไฟล์ที่อ่านไม่ได้
            }
        }
        
        return files;
    }

    /**
     * จัดหมวดหมู่ไฟล์
     */
    categorizeFile(fileName) {
        const name = fileName.toLowerCase();
        
        if (name.includes('server') || name.includes('mcp-') || name.includes('security-')) {
            return 'servers';
        }
        if (name.includes('config') || name.includes('.json') || name.includes('package')) {
            return 'configs';
        }
        if (name.includes('test') || name.includes('spec')) {
            return 'tests';
        }
        if (name.includes('.md') || name.includes('readme')) {
            return 'docs';
        }
        if (name.includes('temp') || name.includes('tmp') || name.includes('untitled')) {
            return 'temp';
        }
        if (name.startsWith('.') || name.includes('git-memory')) {
            return 'system';
        }
        
        return 'scripts';
    }

    /**
     * หาไฟล์ที่อาจไม่ได้ใช้
     */
    findPotentiallyUnused(files) {
        return files.filter(file => {
            const name = file.name.toLowerCase();
            return name.includes('untitled') || 
                   name.includes('temp') || 
                   name.includes('tmp') || 
                   name.includes('backup') || 
                   name.includes('old') ||
                   name.includes('test-') && this.isOldFile(file);
        });
    }

    /**
     * ตรวจสอบว่าไฟล์เก่าหรือไม่
     */
    isOldFile(file) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return file.modified < thirtyDaysAgo;
    }

    /**
     * สร้างรายงานแบบเร็ว
     */
    generateQuickReport(files) {
        // จัดหมวดหมู่
        for (const file of files) {
            this.categories[file.category].push(file);
        }

        const unusedFiles = this.findPotentiallyUnused(files);
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: files.length,
                totalSize: this.formatBytes(totalSize),
                unusedFiles: unusedFiles.length
            },
            categories: {},
            unusedFiles: unusedFiles.map(f => f.name),
            filesByExtension: this.groupByExtension(files)
        };

        // สรุปตามหมวดหมู่
        for (const [category, categoryFiles] of Object.entries(this.categories)) {
            if (categoryFiles.length > 0) {
                report.categories[category] = {
                    count: categoryFiles.length,
                    files: categoryFiles.map(f => f.name)
                };
            }
        }

        return report;
    }

    /**
     * จัดกลุ่มตาม extension
     */
    groupByExtension(files) {
        const groups = {};
        for (const file of files) {
            const ext = file.extension || 'no-extension';
            if (!groups[ext]) {
                groups[ext] = 0;
            }
            groups[ext]++;
        }
        return groups;
    }

    /**
     * แปลงขนาดไฟล์
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * รันการวิเคราะห์แบบเร็ว
     */
    run() {
        console.log('🚀 เริ่มการวิเคราะห์ไฟล์แบบเร็ว...');
        console.log('='.repeat(40));
        
        const files = this.quickScan();
        const report = this.generateQuickReport(files);
        
        // บันทึกรายงาน
        const reportPath = path.join(this.projectRoot, 'quick-analysis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 สรุปผลการวิเคราะห์');
        console.log('='.repeat(40));
        console.log(`📁 ไฟล์ทั้งหมด: ${report.summary.totalFiles}`);
        console.log(`💾 ขนาดรวม: ${report.summary.totalSize}`);
        console.log(`🗑️  ไฟล์ที่อาจไม่ได้ใช้: ${report.summary.unusedFiles}`);
        
        console.log('\n📂 หมวดหมู่ไฟล์:');
        for (const [category, data] of Object.entries(report.categories)) {
            console.log(`  ${category}: ${data.count} ไฟล์`);
        }
        
        console.log('\n📄 ไฟล์ตาม Extension:');
        for (const [ext, count] of Object.entries(report.filesByExtension)) {
            console.log(`  ${ext}: ${count} ไฟล์`);
        }
        
        if (report.unusedFiles.length > 0) {
            console.log('\n🗑️  ไฟล์ที่อาจไม่ได้ใช้งาน:');
            report.unusedFiles.forEach(file => {
                console.log(`  - ${file}`);
            });
        }
        
        console.log(`\n✅ รายงานถูกบันทึกที่: ${reportPath}`);
        
        return report;
    }
}

// รันการวิเคราะห์
if (require.main === module) {
    const analyzer = new QuickFileAnalyzer();
    analyzer.run();
}

module.exports = QuickFileAnalyzer;