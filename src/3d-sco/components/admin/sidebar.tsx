'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  Menu,
  Home,
  MessageSquare,
  BarChart3,
  FileText,
  Shield,
  Bell,
  Flag
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'แดชบอร์ด',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'จัดการโปรเจกต์',
    href: '/admin/projects',
    icon: FolderOpen,
  },
  {
    title: 'ผู้ใช้ออนไลน์',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'ข้อความแชท',
    href: '/admin/messages',
    icon: MessageSquare,
  },
  {
    title: 'สถิติและรายงาน',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'จัดการการแจ้งเตือน',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    name: 'Feature Flags & A/B Testing',
    href: '/admin/feature-flags',
    icon: Flag,
  },
  {
    title: 'จัดการเนื้อหา',
    href: '/admin/content',
    icon: FileText,
  },
  {
    title: 'การตั้งค่า',
    href: '/admin/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-primary mr-3" />
            <h2 className="text-lg font-semibold tracking-tight">
              แผงควบคุมแอดมิน
            </h2>
          </div>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                กลับสู่เว็บไซต์หลัก
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            เมนูหลัก
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <Sidebar />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}