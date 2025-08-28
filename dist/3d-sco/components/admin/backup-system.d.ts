interface BackupSystemProps {
    onBackupComplete?: (success: boolean, message: string) => void;
    onRestoreComplete?: (success: boolean, message: string) => void;
}
export declare function BackupSystem({ onBackupComplete, onRestoreComplete }: BackupSystemProps): any;
export default BackupSystem;
//# sourceMappingURL=backup-system.d.ts.map