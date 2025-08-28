export declare const db: any;
export declare function connectDB(): Promise<void>;
export declare function disconnectDB(): Promise<void>;
export declare function checkDBHealth(): Promise<{
    status: string;
    timestamp: string;
    error?: undefined;
} | {
    status: string;
    error: string;
    timestamp: string;
}>;
export default db;
//# sourceMappingURL=db.d.ts.map