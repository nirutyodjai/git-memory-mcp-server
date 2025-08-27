const os = require('os');
const fs = require('fs');
const path = require('path');

// 🎨 สีสำหรับ console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 📊 ข้อมูลสถิติ
let stats = {
  startTime: Date.now(),
  maxMemory: 0,
  avgMemory: 0,
  memoryReadings: [],
  maxCpu: 0,
  avgCpu: 0,
  cpuReadings: [],
  warnings: 0,
  alerts: 0
};

// 🎯 เกณฑ์การแจ้งเตือน
const thresholds = {
  memory: {
    warning: 1024, // 1GB
    critical: 2048 // 2GB
  },
  cpu: {
    warning: 50, // 50%
    critical: 80 // 80%
  }
};

// 📝 บันทึก log
function writeLog(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  try {
    fs.appendFileSync('performance.log', logMessage);
  } catch (error) {
    console.error('❌ Cannot write to log file:', error.message);
  }
}

// 🔄 แปลงไบต์เป็น MB
function bytesToMB(bytes) {
  return Math.round(bytes / 1024 / 1024);
}

// 📊 คำนวณเปอร์เซ็นต์ CPU
function calculateCpuPercent(cpuUsage) {
  const totalTime = cpuUsage.user + cpuUsage.system;
  return Math.round((totalTime / 1000000) * 100); // แปลงจาก microseconds
}

// 🎨 สร้างแถบแสดงผล
function createProgressBar(value, max, width = 20) {
  const percentage = Math.min(100, (value / max) * 100);
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  let color = colors.green;
  if (percentage > 80) color = colors.red;
  else if (percentage > 60) color = colors.yellow;
  
  return `${color}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset} ${percentage.toFixed(1)}%`;
}

// 📊 ตรวจสอบประสิทธิภาพ
function monitorPerformance() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const systemMem = os.totalmem();
  const freeMem = os.freemem();
  const usedSystemMem = systemMem - freeMem;
  
  // 💾 ข้อมูลหน่วยความจำ
  const heapUsedMB = bytesToMB(memUsage.heapUsed);
  const heapTotalMB = bytesToMB(memUsage.heapTotal);
  const rssMB = bytesToMB(memUsage.rss);
  const externalMB = bytesToMB(memUsage.external);
  const systemMemMB = bytesToMB(systemMem);
  const usedSystemMemMB = bytesToMB(usedSystemMem);
  const freeMemMB = bytesToMB(freeMem);
  
  // ⚡ ข้อมูล CPU
  const cpuPercent = calculateCpuPercent(cpuUsage);
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  
  // 📈 อัปเดตสถิติ
  stats.maxMemory = Math.max(stats.maxMemory, heapUsedMB);
  stats.memoryReadings.push(heapUsedMB);
  if (stats.memoryReadings.length > 60) stats.memoryReadings.shift(); // เก็บ 60 ค่าล่าสุด
  stats.avgMemory = stats.memoryReadings.reduce((a, b) => a + b, 0) / stats.memoryReadings.length;
  
  stats.maxCpu = Math.max(stats.maxCpu, cpuPercent);
  stats.cpuReadings.push(cpuPercent);
  if (stats.cpuReadings.length > 60) stats.cpuReadings.shift();
  stats.avgCpu = stats.cpuReadings.reduce((a, b) => a + b, 0) / stats.cpuReadings.length;
  
  // 🚨 ตรวจสอบการแจ้งเตือน
  let alertLevel = 'NORMAL';
  let alertColor = colors.green;
  
  if (heapUsedMB > thresholds.memory.critical || cpuPercent > thresholds.cpu.critical) {
    alertLevel = 'CRITICAL';
    alertColor = colors.red;
    stats.alerts++;
    writeLog(`CRITICAL: Memory ${heapUsedMB}MB, CPU ${cpuPercent}%`, 'CRITICAL');
  } else if (heapUsedMB > thresholds.memory.warning || cpuPercent > thresholds.cpu.warning) {
    alertLevel = 'WARNING';
    alertColor = colors.yellow;
    stats.warnings++;
    writeLog(`WARNING: Memory ${heapUsedMB}MB, CPU ${cpuPercent}%`, 'WARNING');
  }
  
  // 🖥️ แสดงผล
  console.clear();
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('████████████████████████████████████████████████████████');
  console.log('█                                                      █');
  console.log('█  📊 MCP Performance Monitor - Lightweight Mode      █');
  console.log('█                                                      █');
  console.log('████████████████████████████████████████████████████████');
  console.log(`${colors.reset}\n`);
  
  // 🚨 สถานะการแจ้งเตือน
  console.log(`${alertColor}🚨 Status: ${alertLevel}${colors.reset}`);
  console.log(`⏰ Uptime: ${Math.round((Date.now() - stats.startTime) / 1000)}s`);
  console.log(`📅 Time: ${new Date().toLocaleString('th-TH')}\n`);
  
  // 💾 หน่วยความจำ Process
  console.log(`${colors.bright}💾 Process Memory:${colors.reset}`);
  console.log(`   Heap Used:  ${createProgressBar(heapUsedMB, 2048)} (${heapUsedMB}MB)`);
  console.log(`   Heap Total: ${heapTotalMB}MB`);
  console.log(`   RSS:        ${rssMB}MB`);
  console.log(`   External:   ${externalMB}MB\n`);
  
  // 🖥️ หน่วยความจำระบบ
  console.log(`${colors.bright}🖥️  System Memory:${colors.reset}`);
  console.log(`   Total:      ${systemMemMB}MB`);
  console.log(`   Used:       ${createProgressBar(usedSystemMemMB, systemMemMB)} (${usedSystemMemMB}MB)`);
  console.log(`   Free:       ${freeMemMB}MB\n`);
  
  // ⚡ CPU
  console.log(`${colors.bright}⚡ CPU Usage:${colors.reset}`);
  console.log(`   Current:    ${createProgressBar(cpuPercent, 100)} (${cpuPercent}%)`);
  console.log(`   Cores:      ${cpuCount}`);
  console.log(`   Load Avg:   ${loadAvg.map(l => l.toFixed(2)).join(', ')}\n`);
  
  // 📈 สถิติ
  console.log(`${colors.bright}📈 Statistics:${colors.reset}`);
  console.log(`   Max Memory: ${stats.maxMemory}MB`);
  console.log(`   Avg Memory: ${stats.avgMemory.toFixed(1)}MB`);
  console.log(`   Max CPU:    ${stats.maxCpu}%`);
  console.log(`   Avg CPU:    ${stats.avgCpu.toFixed(1)}%`);
  console.log(`   Warnings:   ${stats.warnings}`);
  console.log(`   Alerts:     ${stats.alerts}\n`);
  
  // 💡 คำแนะนำ
  console.log(`${colors.bright}💡 Recommendations:${colors.reset}`);
  if (heapUsedMB > thresholds.memory.critical) {
    console.log(`   ${colors.red}🚨 CRITICAL: Restart server immediately!${colors.reset}`);
  } else if (heapUsedMB > thresholds.memory.warning) {
    console.log(`   ${colors.yellow}⚠️  WARNING: Consider restarting server${colors.reset}`);
  } else if (heapUsedMB < 512) {
    console.log(`   ${colors.green}✅ EXCELLENT: Memory usage is optimal${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✅ GOOD: Memory usage is acceptable${colors.reset}`);
  }
  
  if (cpuPercent > thresholds.cpu.critical) {
    console.log(`   ${colors.red}🚨 CRITICAL: CPU usage too high!${colors.reset}`);
  } else if (cpuPercent > thresholds.cpu.warning) {
    console.log(`   ${colors.yellow}⚠️  WARNING: High CPU usage detected${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✅ CPU usage is normal${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}🔧 Controls:${colors.reset}`);
  console.log(`   Ctrl+C: Exit monitor`);
  console.log(`   Log file: performance.log`);
  console.log(`   Update: Every 5 seconds\n`);
  
  console.log('════════════════════════════════════════════════════════');
  
  // 📝 บันทึก log
  writeLog(`Memory: ${heapUsedMB}MB, CPU: ${cpuPercent}%, Status: ${alertLevel}`);
}

// 🎯 ฟังก์ชันสำหรับทดสอบ MCP Server
async function testMcpServer() {
  try {
    const response = await fetch('http://localhost:9090/health');
    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ MCP Server: Online${colors.reset}`);
      console.log(`   Mode: ${data.mode}`);
      console.log(`   Servers: ${data.serverCount}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}❌ MCP Server: Offline${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// 🚀 เริ่มการตรวจสอบ
console.log(`${colors.cyan}🚀 Starting MCP Performance Monitor...${colors.reset}`);
console.log(`📊 Monitoring interval: 5 seconds`);
console.log(`📝 Log file: performance.log`);
console.log(`⚠️  Memory warning: ${thresholds.memory.warning}MB`);
console.log(`🚨 Memory critical: ${thresholds.memory.critical}MB`);
console.log(`⚠️  CPU warning: ${thresholds.cpu.warning}%`);
console.log(`🚨 CPU critical: ${thresholds.cpu.critical}%\n`);

// เริ่มการตรวจสอบทันที
monitorPerformance();

// ตั้งเวลาการตรวจสอบ
const monitorInterval = setInterval(monitorPerformance, 5000);

// 🛑 จัดการการปิดโปรแกรม
process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}🛑 Stopping performance monitor...${colors.reset}`);
  clearInterval(monitorInterval);
  
  // สรุปสถิติ
  const runtime = Math.round((Date.now() - stats.startTime) / 1000);
  console.log(`\n${colors.bright}📊 Final Statistics:${colors.reset}`);
  console.log(`   Runtime: ${runtime}s`);
  console.log(`   Max Memory: ${stats.maxMemory}MB`);
  console.log(`   Avg Memory: ${stats.avgMemory.toFixed(1)}MB`);
  console.log(`   Max CPU: ${stats.maxCpu}%`);
  console.log(`   Avg CPU: ${stats.avgCpu.toFixed(1)}%`);
  console.log(`   Warnings: ${stats.warnings}`);
  console.log(`   Alerts: ${stats.alerts}`);
  
  writeLog(`Monitor stopped. Runtime: ${runtime}s, Max Memory: ${stats.maxMemory}MB, Warnings: ${stats.warnings}, Alerts: ${stats.alerts}`, 'INFO');
  
  console.log(`\n${colors.green}✅ Performance monitor stopped successfully${colors.reset}`);
  process.exit(0);
});

// ❌ จัดการ error
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}❌ Uncaught Exception:${colors.reset}`, error);
  writeLog(`Uncaught Exception: ${error.message}`, 'ERROR');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}❌ Unhandled Rejection:${colors.reset}`, reason);
  writeLog(`Unhandled Rejection: ${reason}`, 'ERROR');
});

// 📤 Export สำหรับใช้เป็น module
module.exports = {
  monitorPerformance,
  stats,
  thresholds
};