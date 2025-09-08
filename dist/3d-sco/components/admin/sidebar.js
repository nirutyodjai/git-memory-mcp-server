"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
exports.MobileSidebar = MobileSidebar;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const utils_1 = require("@/lib/utils");
const button_1 = require("@/components/ui/button");
const scroll_area_1 = require("@/components/ui/scroll-area");
const sheet_1 = require("@/components/ui/sheet");
const lucide_react_1 = require("lucide-react");
const sidebarItems = [
    {
        title: 'แดชบอร์ด',
        href: '/admin',
        icon: lucide_react_1.LayoutDashboard,
    },
    {
        title: 'จัดการโปรเจกต์',
        href: '/admin/projects',
        icon: lucide_react_1.FolderOpen,
    },
    {
        title: 'ผู้ใช้ออนไลน์',
        href: '/admin/users',
        icon: lucide_react_1.Users,
    },
    {
        title: 'ข้อความแชท',
        href: '/admin/messages',
        icon: lucide_react_1.MessageSquare,
    },
    {
        title: 'สถิติและรายงาน',
        href: '/admin/analytics',
        icon: lucide_react_1.BarChart3,
    },
    {
        name: 'จัดการการแจ้งเตือน',
        href: '/admin/notifications',
        icon: lucide_react_1.Bell,
    },
    {
        name: 'Feature Flags & A/B Testing',
        href: '/admin/feature-flags',
        icon: lucide_react_1.Flag,
    },
    {
        title: 'จัดการเนื้อหา',
        href: '/admin/content',
        icon: lucide_react_1.FileText,
    },
    {
        title: 'การตั้งค่า',
        href: '/admin/settings',
        icon: lucide_react_1.Settings,
    },
];
function Sidebar({ className }) {
    const pathname = (0, navigation_1.usePathname)();
    return (React.createElement("div", { className: (0, utils_1.cn)('pb-12', className) },
        React.createElement("div", { className: "space-y-4 py-4" },
            React.createElement("div", { className: "px-3 py-2" },
                React.createElement("div", { className: "flex items-center mb-6" },
                    React.createElement(lucide_react_1.Shield, { className: "h-8 w-8 text-primary mr-3" }),
                    React.createElement("h2", { className: "text-lg font-semibold tracking-tight" }, "\u0E41\u0E1C\u0E07\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19")),
                React.createElement("div", { className: "space-y-1" },
                    React.createElement(button_1.Button, { variant: "ghost", className: "w-full justify-start", asChild: true },
                        React.createElement(link_1.default, { href: "/" },
                            React.createElement(lucide_react_1.Home, { className: "mr-2 h-4 w-4" }),
                            "\u0E01\u0E25\u0E31\u0E1A\u0E2A\u0E39\u0E48\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E2B\u0E25\u0E31\u0E01")))),
            React.createElement("div", { className: "px-3 py-2" },
                React.createElement("h2", { className: "mb-2 px-4 text-lg font-semibold tracking-tight" }, "\u0E40\u0E21\u0E19\u0E39\u0E2B\u0E25\u0E31\u0E01"),
                React.createElement("div", { className: "space-y-1" }, sidebarItems.map((item) => (React.createElement(button_1.Button, { key: item.href, variant: pathname === item.href ? 'secondary' : 'ghost', className: "w-full justify-start", asChild: true },
                    React.createElement(link_1.default, { href: item.href },
                        React.createElement(item.icon, { className: "mr-2 h-4 w-4" }),
                        item.title)))))))));
}
function MobileSidebar() {
    const [open, setOpen] = (0, react_1.useState)(false);
    return (React.createElement(sheet_1.Sheet, { open: open, onOpenChange: setOpen },
        React.createElement(sheet_1.SheetTrigger, { asChild: true },
            React.createElement(button_1.Button, { variant: "ghost", className: "mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden" },
                React.createElement(lucide_react_1.Menu, { className: "h-6 w-6" }),
                React.createElement("span", { className: "sr-only" }, "Toggle Menu"))),
        React.createElement(sheet_1.SheetContent, { side: "left", className: "pr-0" },
            React.createElement(scroll_area_1.ScrollArea, { className: "my-4 h-[calc(100vh-8rem)] pb-10 pl-6" },
                React.createElement(Sidebar, null)))));
}
