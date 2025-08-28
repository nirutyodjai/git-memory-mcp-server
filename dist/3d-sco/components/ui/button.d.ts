import { type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, type ReactNode } from "react";
declare const buttonVariants: any;
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    children?: ReactNode;
}
declare const Button: any;
export { Button, buttonVariants };
//# sourceMappingURL=button.d.ts.map