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
    return (<div className="border-b">
      <div className="flex h-16 items-center px-4">
        <sidebar_1.MobileSidebar />
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              ยินดีต้อนรับ,
            </span>
            <span className="text-sm font-medium">{user?.username}</span>
          </div>
          <dropdown_menu_1.DropdownMenu>
            <dropdown_menu_1.DropdownMenuTrigger asChild>
              <button_1.Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <avatar_1.Avatar className="h-8 w-8">
                  <avatar_1.AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </avatar_1.AvatarFallback>
                </avatar_1.Avatar>
              </button_1.Button>
            </dropdown_menu_1.DropdownMenuTrigger>
            <dropdown_menu_1.DropdownMenuContent className="w-56" align="end" forceMount>
              <dropdown_menu_1.DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    ผู้ดูแลระบบ
                  </p>
                </div>
              </dropdown_menu_1.DropdownMenuLabel>
              <dropdown_menu_1.DropdownMenuSeparator />
              <dropdown_menu_1.DropdownMenuItem>
                <lucide_react_1.User className="mr-2 h-4 w-4"/>
                <span>โปรไฟล์</span>
              </dropdown_menu_1.DropdownMenuItem>
              <dropdown_menu_1.DropdownMenuItem>
                <lucide_react_1.Settings className="mr-2 h-4 w-4"/>
                <span>การตั้งค่า</span>
              </dropdown_menu_1.DropdownMenuItem>
              <dropdown_menu_1.DropdownMenuSeparator />
              <dropdown_menu_1.DropdownMenuItem onClick={handleLogout}>
                <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
                <span>ออกจากระบบ</span>
              </dropdown_menu_1.DropdownMenuItem>
            </dropdown_menu_1.DropdownMenuContent>
          </dropdown_menu_1.DropdownMenu>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=header.js.map