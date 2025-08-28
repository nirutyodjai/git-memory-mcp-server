"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
exports.checkDBHealth = checkDBHealth;
const prisma_1 = require("../generated/prisma");
const globalForPrisma = globalThis;
exports.db = globalForPrisma.prisma ??
    new prisma_1.PrismaClient({
        log: ['query'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.db;
// Database connection helper
async function connectDB() {
    try {
        await exports.db.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}
// Database disconnection helper
async function disconnectDB() {
    try {
        await exports.db.$disconnect();
        console.log('✅ Database disconnected successfully');
    }
    catch (error) {
        console.error('❌ Database disconnection failed:', error);
        throw error;
    }
}
// Health check
async function checkDBHealth() {
    try {
        await exports.db.$queryRaw `SELECT 1`;
        return { status: 'healthy', timestamp: new Date().toISOString() };
    }
    catch (error) {
        return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() };
    }
}
exports.default = exports.db;
//# sourceMappingURL=db.js.map