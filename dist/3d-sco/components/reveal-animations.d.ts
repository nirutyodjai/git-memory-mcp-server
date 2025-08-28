import { ReactNode } from "react";
interface BlurIntProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    variant?: {
        hidden: {
            filter: string;
            opacity: number;
        };
        visible: {
            filter: string;
            opacity: number;
        };
    };
    duration?: number;
}
export declare const BlurIn: ({ children, className, variant, delay, duration, }: BlurIntProps) => any;
interface BoxRevealProps {
    children: JSX.Element;
    width?: "fit-content" | "100%";
    boxColor?: string;
    duration?: number;
    delay?: number;
    once?: boolean;
}
export declare const BoxReveal: ({ children, width, boxColor, duration, delay, once, }: BoxRevealProps) => any;
export {};
//# sourceMappingURL=reveal-animations.d.ts.map