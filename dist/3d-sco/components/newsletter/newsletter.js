"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Newsletter = Newsletter;
exports.NewsletterPopup = NewsletterPopup;
exports.NewsletterBanner = NewsletterBanner;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function Newsletter({ title = "รับข่าวสารล่าสุด", description = "สมัครรับข่าวสารและบทความใหม่ๆ ส่งตรงถึงอีเมลของคุณ", placeholder = "กรอกอีเมลของคุณ", buttonText = "สมัครสมาชิก", className = "", variant = "default" }) {
    const [email, setEmail] = (0, react_1.useState)('');
    const [status, setStatus] = (0, react_1.useState)('idle');
    const [message, setMessage] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !isValidEmail(email)) {
            setStatus('error');
            setMessage('กรุณากรอกอีเมลที่ถูกต้อง');
            return;
        }
        setStatus('loading');
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (data.success) {
                setStatus('success');
                setMessage(data.message || 'สมัครสมาชิกสำเร็จแล้ว!');
                setEmail('');
            }
            else {
                setStatus('error');
                setMessage(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            }
        }
        catch (error) {
            setStatus('error');
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        }
    };
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    const getVariantClasses = () => {
        switch (variant) {
            case 'minimal':
                return 'bg-transparent border-0 p-0';
            case 'card':
                return 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700';
            case 'inline':
                return 'flex items-center gap-4';
            default:
                return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6';
        }
    };
    return (React.createElement("div", { className: `newsletter ${getVariantClasses()} ${className}` },
        variant !== 'inline' && (React.createElement("div", { className: "text-center mb-6" },
            React.createElement("div", { className: "flex justify-center mb-4" },
                React.createElement("div", { className: "p-3 bg-blue-100 dark:bg-blue-900 rounded-full" },
                    React.createElement(lucide_react_1.Mail, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }))),
            React.createElement("h3", { className: "text-xl font-bold text-gray-900 dark:text-white mb-2" }, title),
            React.createElement("p", { className: "text-gray-600 dark:text-gray-300" }, description))),
        React.createElement("form", { onSubmit: handleSubmit, className: variant === 'inline' ? 'flex gap-2' : 'space-y-4' },
            React.createElement("div", { className: variant === 'inline' ? 'flex-1' : 'w-full' },
                React.createElement("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: placeholder, className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400", disabled: status === 'loading' || status === 'success', required: true })),
            React.createElement("button", { type: "submit", disabled: status === 'loading' || status === 'success', className: `${variant === 'inline' ? 'px-6 py-3' : 'w-full py-3'} bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2` },
                status === 'loading' && React.createElement(lucide_react_1.Loader2, { className: "w-4 h-4 animate-spin" }),
                status === 'success' && React.createElement(lucide_react_1.CheckCircle, { className: "w-4 h-4" }),
                status === 'loading' ? 'กำลังสมัคร...' : status === 'success' ? 'สำเร็จ!' : buttonText)),
        message && (React.createElement("div", { className: `mt-4 p-3 rounded-lg flex items-center gap-2 ${status === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}` },
            status === 'success' ? (React.createElement(lucide_react_1.CheckCircle, { className: "w-4 h-4" })) : (React.createElement(lucide_react_1.AlertCircle, { className: "w-4 h-4" })),
            React.createElement("span", { className: "text-sm" }, message))),
        variant !== 'minimal' && (React.createElement("div", { className: "mt-4 text-xs text-gray-500 dark:text-gray-400 text-center" }, "\u0E40\u0E23\u0E32\u0E08\u0E30\u0E44\u0E21\u0E48\u0E41\u0E0A\u0E23\u0E4C\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E01\u0E31\u0E1A\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21 \u0E41\u0E25\u0E30\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E44\u0E14\u0E49\u0E15\u0E25\u0E2D\u0E14\u0E40\u0E27\u0E25\u0E32"))));
}
function NewsletterPopup({ isOpen, onClose, title = "อย่าพลาดข่าวสารดีๆ!", description = "สมัครรับข่าวสารและเทคนิคใหม่ๆ ส่งตรงถึงอีเมลของคุณ" }) {
    if (!isOpen)
        return null;
    return (React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" },
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg max-w-md w-full relative" },
            React.createElement("button", { onClick: onClose, className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" },
                React.createElement("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }))),
            React.createElement("div", { className: "p-6" },
                React.createElement(Newsletter, { title: title, description: description, variant: "card", className: "border-0 shadow-none p-0 bg-transparent" })))));
}
// Newsletter Banner Component
function NewsletterBanner({ onDismiss }) {
    return (React.createElement("div", { className: "bg-blue-600 text-white py-3 px-4" },
        React.createElement("div", { className: "container mx-auto flex items-center justify-between" },
            React.createElement("div", { className: "flex items-center gap-4" },
                React.createElement(lucide_react_1.Mail, { className: "w-5 h-5" }),
                React.createElement("span", { className: "text-sm font-medium" }, "\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E23\u0E31\u0E1A\u0E02\u0E48\u0E32\u0E27\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E30\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04\u0E43\u0E2B\u0E21\u0E48\u0E46 \u0E17\u0E38\u0E01\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C")),
            React.createElement("div", { className: "flex items-center gap-4" },
                React.createElement(Newsletter, { variant: "inline", placeholder: "\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13", buttonText: "\u0E2A\u0E21\u0E31\u0E04\u0E23", className: "bg-transparent" }),
                onDismiss && (React.createElement("button", { onClick: onDismiss, className: "text-white hover:text-gray-200 ml-4" },
                    React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }))))))));
}
exports.default = Newsletter;
