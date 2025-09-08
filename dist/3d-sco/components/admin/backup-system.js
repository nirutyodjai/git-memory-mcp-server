"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupSystem = BackupSystem;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function BackupSystem({ onBackupComplete, onRestoreComplete }) {
    const [isBackingUp, setIsBackingUp] = (0, react_1.useState)(false);
    const [isRestoring, setIsRestoring] = (0, react_1.useState)(false);
    const [backupHistory, setBackupHistory] = (0, react_1.useState)([]);
    // Create full backup
    const createFullBackup = async () => {
        setIsBackingUp(true);
        try {
            const response = await fetch('/api/admin/backup/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: 'full' }),
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `3d-sco-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                onBackupComplete?.(true, 'สำรองข้อมูลสำเร็จแล้ว');
            }
            else {
                throw new Error('Backup failed');
            }
        }
        catch (error) {
            console.error('Backup error:', error);
            onBackupComplete?.(false, 'เกิดข้อผิดพลาดในการสำรองข้อมูล');
        }
        finally {
            setIsBackingUp(false);
        }
    };
    // Export specific data type
    const exportData = async (dataType) => {
        try {
            const response = await fetch(`/api/admin/export/${dataType}`, {
                method: 'GET',
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        }
        catch (error) {
            console.error('Export error:', error);
        }
    };
    // Restore from backup file
    const restoreFromBackup = async (file) => {
        setIsRestoring(true);
        try {
            const formData = new FormData();
            formData.append('backup', file);
            const response = await fetch('/api/admin/backup/restore', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.success) {
                onRestoreComplete?.(true, 'กู้คืนข้อมูลสำเร็จแล้ว');
            }
            else {
                throw new Error(result.error || 'Restore failed');
            }
        }
        catch (error) {
            console.error('Restore error:', error);
            onRestoreComplete?.(false, 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
        }
        finally {
            setIsRestoring(false);
        }
    };
    // Handle file upload for restore
    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/json') {
            restoreFromBackup(file);
        }
        else {
            alert('กรุณาเลือกไฟล์ JSON เท่านั้น');
        }
    };
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow p-6" },
            React.createElement("div", { className: "flex items-center gap-3 mb-4" },
                React.createElement(lucide_react_1.Database, { className: "w-6 h-6 text-blue-600" }),
                React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white" }, "\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" },
                React.createElement("button", { onClick: createFullBackup, disabled: isBackingUp, className: "flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors" },
                    isBackingUp ? (React.createElement(lucide_react_1.Loader2, { className: "w-5 h-5 animate-spin text-blue-600" })) : (React.createElement(lucide_react_1.Download, { className: "w-5 h-5 text-blue-600" })),
                    React.createElement("span", { className: "text-blue-600 font-medium" }, isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูลทั้งหมด')),
                React.createElement("div", { className: "relative" },
                    React.createElement("input", { type: "file", accept: ".json", onChange: handleFileUpload, className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer", disabled: isRestoring }),
                    React.createElement("div", { className: "flex items-center justify-center gap-2 p-4 border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors" },
                        isRestoring ? (React.createElement(lucide_react_1.Loader2, { className: "w-5 h-5 animate-spin text-green-600" })) : (React.createElement(lucide_react_1.Upload, { className: "w-5 h-5 text-green-600" })),
                        React.createElement("span", { className: "text-green-600 font-medium" }, isRestoring ? 'กำลังกู้คืนข้อมูล...' : 'กู้คืนจากไฟล์สำรอง')))),
            React.createElement("div", { className: "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4" },
                React.createElement("div", { className: "flex items-start gap-3" },
                    React.createElement(lucide_react_1.AlertTriangle, { className: "w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" }),
                    React.createElement("div", null,
                        React.createElement("h3", { className: "font-medium text-yellow-800 dark:text-yellow-200 mb-1" }, "\u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E2A\u0E33\u0E04\u0E31\u0E0D"),
                        React.createElement("ul", { className: "text-sm text-yellow-700 dark:text-yellow-300 space-y-1" },
                            React.createElement("li", null, "\u2022 \u0E01\u0E32\u0E23\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E30\u0E40\u0E02\u0E35\u0E22\u0E19\u0E17\u0E31\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"),
                            React.createElement("li", null, "\u2022 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E17\u0E33\u0E01\u0E32\u0E23\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19"),
                            React.createElement("li", null, "\u2022 \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E41\u0E19\u0E48\u0E43\u0E08\u0E27\u0E48\u0E32\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E25\u0E30\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C")))))),
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow p-6" },
            React.createElement("div", { className: "flex items-center gap-3 mb-4" },
                React.createElement(lucide_react_1.FileText, { className: "w-6 h-6 text-purple-600" }),
                React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white" }, "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E22\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17")),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" },
                React.createElement("button", { onClick: () => exportData('projects'), className: "flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors" },
                    React.createElement(lucide_react_1.Database, { className: "w-8 h-8 text-blue-600" }),
                    React.createElement("span", { className: "font-medium text-gray-900 dark:text-white" }, "\u0E42\u0E1B\u0E23\u0E40\u0E08\u0E01\u0E15\u0E4C"),
                    React.createElement("span", { className: "text-sm text-gray-500 dark:text-gray-400" }, "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E42\u0E1B\u0E23\u0E40\u0E08\u0E01\u0E15\u0E4C")),
                React.createElement("button", { onClick: () => exportData('blog'), className: "flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors" },
                    React.createElement(lucide_react_1.FileText, { className: "w-8 h-8 text-green-600" }),
                    React.createElement("span", { className: "font-medium text-gray-900 dark:text-white" }, "\u0E1A\u0E25\u0E47\u0E2D\u0E01"),
                    React.createElement("span", { className: "text-sm text-gray-500 dark:text-gray-400" }, "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E1A\u0E17\u0E04\u0E27\u0E32\u0E21")),
                React.createElement("button", { onClick: () => exportData('subscribers'), className: "flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors" },
                    React.createElement(lucide_react_1.Mail, { className: "w-8 h-8 text-purple-600" }),
                    React.createElement("span", { className: "font-medium text-gray-900 dark:text-white" }, "\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"),
                    React.createElement("span", { className: "text-sm text-gray-500 dark:text-gray-400" }, "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01")),
                React.createElement("button", { onClick: () => exportData('uploads'), className: "flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 transition-colors" },
                    React.createElement(lucide_react_1.Image, { className: "w-8 h-8 text-orange-600" }),
                    React.createElement("span", { className: "font-medium text-gray-900 dark:text-white" }, "\u0E44\u0E1F\u0E25\u0E4C"),
                    React.createElement("span", { className: "text-sm text-gray-500 dark:text-gray-400" }, "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E25\u0E4C")))),
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow p-6" },
            React.createElement("div", { className: "flex items-center gap-3 mb-4" },
                React.createElement(lucide_react_1.Calendar, { className: "w-6 h-6 text-gray-600" }),
                React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white" }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")),
            backupHistory.length === 0 ? (React.createElement("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400" },
                React.createElement(lucide_react_1.Database, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }),
                React.createElement("p", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))) : (React.createElement("div", { className: "space-y-3" }, backupHistory.map((backup) => (React.createElement("div", { key: backup.id, className: "flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement(lucide_react_1.CheckCircle, { className: "w-5 h-5 text-green-600" }),
                    React.createElement("div", null,
                        React.createElement("div", { className: "font-medium text-gray-900 dark:text-white" }, backup.name),
                        React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" },
                            backup.date,
                            " \u2022 ",
                            backup.size,
                            " \u2022 ",
                            backup.type === 'full' ? 'สำรองทั้งหมด' : 'สำรองบางส่วน'))),
                React.createElement("button", { className: "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" },
                    React.createElement(lucide_react_1.Download, { className: "w-4 h-4" })))))))),
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow p-6" },
            React.createElement("div", { className: "flex items-center gap-3 mb-4" },
                React.createElement(lucide_react_1.Calendar, { className: "w-6 h-6 text-indigo-600" }),
                React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white" }, "\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")),
            React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "font-medium text-gray-900 dark:text-white" }, "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"),
                        React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" }, "\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E38\u0E01\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32 02:00 \u0E19.")),
                    React.createElement("label", { className: "relative inline-flex items-center cursor-pointer" },
                        React.createElement("input", { type: "checkbox", className: "sr-only peer" }),
                        React.createElement("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" }))),
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "font-medium text-gray-900 dark:text-white" }, "\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E44\u0E27\u0E49"),
                        React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49")),
                    React.createElement("select", { className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" },
                        React.createElement("option", { value: "7" }, "7 \u0E44\u0E1F\u0E25\u0E4C"),
                        React.createElement("option", { value: "14" }, "14 \u0E44\u0E1F\u0E25\u0E4C"),
                        React.createElement("option", { value: "30" }, "30 \u0E44\u0E1F\u0E25\u0E4C"),
                        React.createElement("option", { value: "-1" }, "\u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14")))))));
}
exports.default = BackupSystem;
