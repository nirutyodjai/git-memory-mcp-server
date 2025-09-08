import { Pool, PoolClient } from 'pg';
declare const pool: Pool;
export declare function query(text: string, params?: any[]): Promise<any>;
export declare function getClient(): Promise<PoolClient>;
export declare function closePool(): Promise<void>;
export declare function healthCheck(): Promise<boolean>;
export declare function initializeDatabase(): Promise<void>;
export default pool;
//# sourceMappingURL=connection.d.ts.map