'use client';

import { useState } from 'react';
import { Download, Upload, Database, FileText, Image, Mail, Calendar, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface BackupData {
  projects: any[];
  blogPosts: any[];
  subscribers: any[];
  uploads: any[];
  settings: any;
  timestamp: string;
  version: string;
}

interface BackupSystemProps {
  onBackupComplete?: (success: boolean, message: string) => void;
  onRestoreComplete?: (success: boolean, message: string) => void;
}

export function BackupSystem({ onBackupComplete, onRestoreComplete }: BackupSystemProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupHistory, setBackupHistory] = useState<Array<{
    id: string;
    name: string;
    size: string;
    date: string;
    type: 'full' | 'partial';
  }>>([]);

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
      } else {
        throw new Error('Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      onBackupComplete?.(false, 'เกิดข้อผิดพลาดในการสำรองข้อมูล');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Export specific data type
  const exportData = async (dataType: 'projects' | 'blog' | 'subscribers' | 'uploads') => {
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
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Restore from backup file
  const restoreFromBackup = async (file: File) => {
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
      } else {
        throw new Error(result.error || 'Restore failed');
      }
    } catch (error) {
      console.error('Restore error:', error);
      onRestoreComplete?.(false, 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle file upload for restore
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      restoreFromBackup(file);
    } else {
      alert('กรุณาเลือกไฟล์ JSON เท่านั้น');
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            สำรองข้อมูล
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={createFullBackup}
            disabled={isBackingUp}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            {isBackingUp ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-5 h-5 text-blue-600" />
            )}
            <span className="text-blue-600 font-medium">
              {isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูลทั้งหมด'}
            </span>
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isRestoring}
            />
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors">
              {isRestoring ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              ) : (
                <Upload className="w-5 h-5 text-green-600" />
              )}
              <span className="text-green-600 font-medium">
                {isRestoring ? 'กำลังกู้คืนข้อมูล...' : 'กู้คืนจากไฟล์สำรอง'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                คำเตือนสำคัญ
              </h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• การกู้คืนข้อมูลจะเขียนทับข้อมูลปัจจุบันทั้งหมด</li>
                <li>• กรุณาสำรองข้อมูลปัจจุบันก่อนทำการกู้คืน</li>
                <li>• ตรวจสอบไฟล์สำรองให้แน่ใจว่าถูกต้องและสมบูรณ์</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ส่งออกข้อมูลแยกประเภท
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => exportData('projects')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <Database className="w-8 h-8 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">โปรเจกต์</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">ส่งออกข้อมูลโปรเจกต์</span>
          </button>

          <button
            onClick={() => exportData('blog')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors"
          >
            <FileText className="w-8 h-8 text-green-600" />
            <span className="font-medium text-gray-900 dark:text-white">บล็อก</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">ส่งออกบทความ</span>
          </button>

          <button
            onClick={() => exportData('subscribers')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
          >
            <Mail className="w-8 h-8 text-purple-600" />
            <span className="font-medium text-gray-900 dark:text-white">สมาชิก</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">ส่งออกรายชื่อสมาชิก</span>
          </button>

          <button
            onClick={() => exportData('uploads')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 transition-colors"
          >
            <Image className="w-8 h-8 text-orange-600" />
            <span className="font-medium text-gray-900 dark:text-white">ไฟล์</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">ส่งออกรายการไฟล์</span>
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ประวัติการสำรองข้อมูล
          </h2>
        </div>

        {backupHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีประวัติการสำรองข้อมูล</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backupHistory.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {backup.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {backup.date} • {backup.size} • {backup.type === 'full' ? 'สำรองทั้งหมด' : 'สำรองบางส่วน'}
                    </div>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automated Backup Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            การสำรองข้อมูลอัตโนมัติ
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                เปิดใช้งานการสำรองอัตโนมัติ
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                สำรองข้อมูลทุกวันเวลา 02:00 น.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                เก็บไฟล์สำรองไว้
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                จำนวนไฟล์สำรองที่เก็บไว้
              </div>
            </div>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="7">7 ไฟล์</option>
              <option value="14">14 ไฟล์</option>
              <option value="30">30 ไฟล์</option>
              <option value="-1">ไม่จำกัด</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackupSystem;