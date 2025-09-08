"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toaster = Toaster;
const toast_1 = require("@/components/ui/toast");
const use_toast_1 = require("@/components/ui/use-toast");
function Toaster() {
    const { toasts } = (0, use_toast_1.useToast)();
    return (React.createElement(toast_1.ToastProvider, null,
        toasts.map(function ({ id, title, description, action, ...props }) {
            return (React.createElement(toast_1.Toast, { key: id, ...props },
                React.createElement("div", { className: "grid gap-1" },
                    title && React.createElement(toast_1.ToastTitle, null, title),
                    description && (React.createElement(toast_1.ToastDescription, null, description))),
                action,
                React.createElement(toast_1.ToastClose, null)));
        }),
        React.createElement(toast_1.ToastViewport, null)));
}
