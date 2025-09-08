'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Share, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallerProps {
  variant?: 'banner' | 'button' | 'modal';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  autoShow?: boolean;
  className?: string;
}

export default function PWAInstaller({
  variant = 'banner',
  showOnMobile = true,
  showOnDesktop = true,
  autoShow = true,
  className = '',
}: PWAInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // ตรวจสอบ iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // ตรวจสอบ standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // ตรวจสอบประเภทอุปกรณ์
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // ตรวจสอบว่าติดตั้งแล้วหรือไม่
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // ตรวจสอบว่าควรแสดง prompt หรือไม่
    const shouldShow = (deviceType === 'mobile' && showOnMobile) || 
                      (deviceType === 'desktop' && showOnDesktop);
    
    if (!shouldShow) return;

    // Event listener สำหรับ beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (autoShow) {
        // แสดง prompt หลังจาก 3 วินาที
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    // Event listener สำหรับ appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [autoShow, showOnMobile, showOnDesktop, deviceType]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowInstallPrompt(true);
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // บันทึกว่าผู้ใช้ปิด prompt แล้ว
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // ไม่แสดงถ้าติดตั้งแล้วหรือไม่มี prompt
  if (isInstalled || (!deferredPrompt && !isIOS)) {
    return null;
  }

  // ตรวจสอบว่าผู้ใช้เคยปิด prompt หรือไม่ (ภายใน 24 ชั่วโมง)
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime) {
    const timeDiff = Date.now() - parseInt(dismissedTime);
    if (timeDiff < 24 * 60 * 60 * 1000) { // 24 ชั่วโมง
      return null;
    }
  }

  // iOS Installation Instructions
  const IOSInstructions = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          ติดตั้ง 3D-SCO Portfolio
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          เพิ่มแอปฯ ลงในหน้าจอหลักของคุณ
        </p>
      </div>
      
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
            1
          </div>
          <p>แตะปุ่ม <strong>แชร์</strong> ที่ด้านล่างของเบราว์เซอร์</p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
            2
          </div>
          <p>เลือก <strong>"เพิ่มที่หน้าจอหลัก"</strong></p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
            3
          </div>
          <p>แตะ <strong>"เพิ่ม"</strong> เพื่อยืนยัน</p>
        </div>
      </div>
    </div>
  );

  if (variant === 'button') {
    return (
      <button
        onClick={handleInstallClick}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          bg-blue-600 hover:bg-blue-700 text-white
          rounded-lg font-medium transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
      >
        <Download className="w-5 h-5" />
        ติดตั้งแอป
      </button>
    );
  }

  if (variant === 'modal' && showInstallPrompt) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>

            {isIOS ? (
              <IOSInstructions />
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  {deviceType === 'mobile' ? (
                    <Smartphone className="w-16 h-16 mx-auto text-blue-600" />
                  ) : (
                    <Monitor className="w-16 h-16 mx-auto text-blue-600" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  ติดตั้ง 3D-SCO Portfolio
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  เข้าถึงได้เร็วขึ้น ทำงานแบบออฟไลน์ และได้รับการแจ้งเตือน
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleInstallClick}
                    className="
                      flex-1 flex items-center justify-center gap-2 px-4 py-3
                      bg-blue-600 hover:bg-blue-700 text-white
                      rounded-lg font-medium transition-colors duration-200
                    "
                  >
                    <Download className="w-5 h-5" />
                    ติดตั้ง
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="
                      flex-1 px-4 py-3
                      bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                      text-gray-700 dark:text-gray-300
                      rounded-lg font-medium transition-colors duration-200
                    "
                  >
                    ไว้ทีหลัง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Default banner variant
  if (showInstallPrompt) {
    return (
      <div className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700
        shadow-lg p-4
        ${className}
      `}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {deviceType === 'mobile' ? (
                <Smartphone className="w-8 h-8 text-blue-600" />
              ) : (
                <Monitor className="w-8 h-8 text-blue-600" />
              )}
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                ติดตั้ง 3D-SCO Portfolio
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                เข้าถึงได้เร็วขึ้นและทำงานแบบออฟไลน์
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="
                flex items-center gap-2 px-4 py-2
                bg-blue-600 hover:bg-blue-700 text-white
                rounded-lg font-medium transition-colors duration-200
                text-sm
              "
            >
              <Download className="w-4 h-4" />
              ติดตั้ง
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Hook สำหรับตรวจสอบสถานะ PWA
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return {
    isInstalled,
    isStandalone,
    canInstall,
  };
}