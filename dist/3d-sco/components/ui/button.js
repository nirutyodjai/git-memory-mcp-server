"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buttonVariants = exports.Button = void 0;
const react_slot_1 = require("@radix-ui/react-slot");
const class_variance_authority_1 = require("class-variance-authority");
const utils_1 = require("@/lib/utils");
const react_1 = require("react");
const buttonVariants = (0, class_variance_authority_1.cva)("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground",
            destructive: "bg-destructive text-destructive-foreground",
            outline: "border border-input bg-background",
            secondary: "bg-secondary text-secondary-foreground",
            ghost: "",
            link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
exports.buttonVariants = buttonVariants;
const addClassNameRecursively = (children, className) => {
    const foo = (child) => {
        if (!(0, react_1.isValidElement)(child))
            return child;
        return (0, react_1.cloneElement)(child, {
            // @ts-ignore
            className: `${child.props.className || ""} ${className}`.trim(),
            children: addClassNameRecursively(child.props.children, className),
        });
    };
    return react_1.Children.map(children, foo);
};
const Button = (0, react_1.forwardRef)(({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? react_slot_1.Slot : "button";
    return (React.createElement(Comp, { className: (0, utils_1.cn)(buttonVariants({ variant, size, className }), "cursor-can-hover"), ref: ref, ...props }, addClassNameRecursively(children, "pointer-events-none")));
});
exports.Button = Button;
Button.displayName = "Button";
