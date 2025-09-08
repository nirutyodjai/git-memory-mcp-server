import React, { useCallback, useState } from 'react';
import { X, Play } from 'lucide-react';
import { universalPluginSystem } from '../../lib/universalPluginSystem';
import { mcpErrorHandler, LogLevel } from '../../lib/mcpErrorHandler';

export interface ToolManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

function ToolManager({ isOpen, onClose }: ToolManagerProps) {
  const [busy, setBusy] = useState(false);

  const handleInitializeUPS = useCallback(async () => {
    setBusy(true);
    try {
      await universalPluginSystem.initialize();
      mcpErrorHandler.log(
        LogLevel.INFO,
        'ToolManager',
        'เริ่มต้นระบบปลั๊กอินสากล (UPS) สำเร็จ'
      );
    } catch (err) {
      mcpErrorHandler.handle(err as Error, {
        context: 'ToolManager',
        action: 'initializeUPS',
      });
    } finally {
      setBusy(false);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">ตัวจัดการเครื่องมือ</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="ปิด"
              title="ปิด"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                ระบบปลั๊กอินสากล (Universal Plugin System)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                เริ่มต้นหรือเริ่มใหม่ระบบปลั๊กอินสากล (UPS)
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleInitializeUPS}
                  disabled={busy}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                    busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>{busy ? 'กำลังเริ่มต้น...' : 'เริ่มต้นระบบปลั๊กอิน'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-100 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToolManager;