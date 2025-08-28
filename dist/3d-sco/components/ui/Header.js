"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const react_1 = __importDefault(require("react"));
const navigation_1 = require("next/navigation");
const i18n_provider_1 = require("@/components/providers/i18n-provider");
const LINKS = [
    { name: "navigation.projects", href: "/projects" },
    { name: "navigation.search", href: "/search" },
    { name: "navigation.contact", href: "/contact" },
    { name: "navigation.about", href: "/about" },
    { name: "navigation.blog", href: "/blog" },
];
const Header = () => {
    const activeRoute = (0, navigation_1.usePathname)();
    const { t } = (0, i18n_provider_1.useI18n)();
    return (<div className="w-screen flex justify-center items-center h-[60px] container-xl mx-auto px-4 absolute top-0">
      {activeRoute !== "/" && (<link_1.default href={"/"} className="p-4 absolute top-0 left-2 text-sm duration-500 hover:text-zinc-300">
          {t('navigation.home', 'navigation')}
        </link_1.default>)}
      <nav>
        {LINKS.map((link) => (<link_1.default key={link.href} href={link.href} className={`p-4 text-sm duration-500 text-zinc-500 hover:text-zinc-300 ${activeRoute === link.href ? "text-zinc-200" : ""}`}>
            {t(link.name, 'navigation')}
          </link_1.default>))}
      </nav>
    </div>);
};
exports.default = Header;
//# sourceMappingURL=Header.js.map