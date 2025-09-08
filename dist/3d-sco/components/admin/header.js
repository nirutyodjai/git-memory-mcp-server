"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminHeader = AdminHeader;
const navigation_1 = require("next/navigation");
const admin_auth_1 = require("@/contexts/admin-auth");
const button_1 = require("@/components/ui/button");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const avatar_1 = require("@/components/ui/avatar");
const sidebar_1 = require("./sidebar");
const lucide_react_1 = require("lucide-react");
function AdminHeader() {
    const { user, logout } = (0, admin_auth_1.useAdminAuth)();
    const router = (0, navigation_1.useRouter)();
    const handleLogout = async () => {
        await logout();
        router.push('/admin/login');
    };
    return (React.createElement("div", { className: "border-b" },
        React.createElement("div", { className: "flex h-16 items-center px-4" },
            React.createElement(sidebar_1.MobileSidebar, null),
            React.createElement("div", { className: "ml-auto flex items-center space-x-4" },
                React.createElement("div", { className: "flex items-center space-x-2" },
                    React.createElement("span", { className: "text-sm text-muted-foreground" }, "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A,"),
                    React.createElement("span", { className: "text-sm font-medium" }, user?.username)),
                React.createElement(dropdown_menu_1.DropdownMenu, null,
                    React.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                        React.createElement(button_1.Button, { variant: "ghost", className: "relative h-8 w-8 rounded-full" },
                            React.createElement(avatar_1.Avatar, { className: "h-8 w-8" },
                                React.createElement(avatar_1.AvatarFallback, null, user?.username?.charAt(0).toUpperCase() || 'A')))),
                    React.createElement(dropdown_menu_1.DropdownMenuContent, { className: "w-56", align: "end", forceMount: true },
                        React.createElement(dropdown_menu_1.DropdownMenuLabel, { className: "font-normal" },
                            React.createElement("div", { className: "flex flex-col space-y-1" },
                                React.createElement("p", { className: "text-sm font-medium leading-none" }, user?.username),
                                React.createElement("p", { className: "text-xs leading-none text-muted-foreground" }, "\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A"))),
                        React.createElement(dropdown_menu_1.DropdownMenuSeparator, null),
                        React.createElement(dropdown_menu_1.DropdownMenuItem, null,
                            React.createElement(lucide_react_1.User, { className: "mr-2 h-4 w-4" }),
                            React.createElement("span", null, "\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C")),
                        React.createElement(dropdown_menu_1.DropdownMenuItem, null,
                            React.createElement(lucide_react_1.Settings, { className: "mr-2 h-4 w-4" }),
                            React.createElement("span", null, "\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32")),
                        React.createElement(dropdown_menu_1.DropdownMenuSeparator, null),
                        React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleLogout },
                            React.createElement(lucide_react_1.LogOut, { className: "mr-2 h-4 w-4" }),
                            React.createElement("span", null, "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A"))))))));
}
