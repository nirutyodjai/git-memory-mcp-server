interface PWAInstallerProps {
    variant?: 'banner' | 'button' | 'modal';
    showOnMobile?: boolean;
    showOnDesktop?: boolean;
    autoShow?: boolean;
    className?: string;
}
export default function PWAInstaller({ variant, showOnMobile, showOnDesktop, autoShow, className, }: PWAInstallerProps): any;
export declare function usePWA(): {
    isInstalled: any;
    isStandalone: any;
    canInstall: any;
};
export {};
//# sourceMappingURL=pwa-installer.d.ts.map