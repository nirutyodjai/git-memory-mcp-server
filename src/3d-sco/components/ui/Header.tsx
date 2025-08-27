"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";

const LINKS = [
  { name: "navigation.projects", href: "/projects" },
  { name: "navigation.search", href: "/search" },
  { name: "navigation.contact", href: "/contact" },
  { name: "navigation.about", href: "/about" },
  { name: "navigation.blog", href: "/blog" },
];

const Header = () => {
  const activeRoute = usePathname();
  const { t } = useI18n();
  return (
    <div className="w-screen flex justify-center items-center h-[60px] container-xl mx-auto px-4 absolute top-0">
      {activeRoute !== "/" && (
        <Link
          href={"/"}
          className="p-4 absolute top-0 left-2 text-sm duration-500 hover:text-zinc-300"
        >
          {t('navigation.home', 'navigation')}
        </Link>
      )}
      <nav>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`p-4 text-sm duration-500 text-zinc-500 hover:text-zinc-300 ${
              activeRoute === link.href ? "text-zinc-200" : ""
            }`}
          >
            {t(link.name, 'navigation')}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Header;
