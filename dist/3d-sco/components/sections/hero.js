"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@/lib/utils");
const link_1 = __importDefault(require("next/link"));
const react_1 = __importDefault(require("react"));
const button_1 = require("../ui/button");
const lucide_react_1 = require("lucide-react");
const tooltip_1 = require("@/components/ui/tooltip");
const preloader_1 = require("../preloader");
const reveal_animations_1 = require("../reveal-animations");
const scroll_down_icon_1 = __importDefault(require("../scroll-down-icon"));
const comdee_1 = require("@/data/comdee");
const HeroSection = () => {
    const { isLoading } = (0, preloader_1.usePreloader)();
    return (react_1.default.createElement("section", { id: "hero", className: (0, utils_1.cn)("relative w-full h-screen") },
        react_1.default.createElement("div", { className: "grid md:grid-cols-2" },
            react_1.default.createElement("div", { className: (0, utils_1.cn)("h-[calc(100dvh-3rem)] md:h-[calc(100dvh-4rem)] z-[2]", "col-span-1", "flex flex-col justify-start md:justify-center items-center md:items-start", "pt-28 sm:pt-0 sm:pb-32 md:p-24 lg:p-40 xl:p-48") }, !isLoading && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "" },
                    react_1.default.createElement(reveal_animations_1.BlurIn, { delay: 0.7 },
                        react_1.default.createElement("p", { className: (0, utils_1.cn)("md:self-start mt-4 font-thin text-md text-slate-500 dark:text-zinc-400 ml-3", "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text ") },
                            "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A\u0E2A\u0E39\u0E48",
                            react_1.default.createElement("br", { className: "md:hidden" }))),
                    react_1.default.createElement(reveal_animations_1.BlurIn, { delay: 1 },
                        react_1.default.createElement(tooltip_1.Tooltip, { delayDuration: 300 },
                            react_1.default.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                react_1.default.createElement("h1", { className: (0, utils_1.cn)("font-thin text-6xl text-transparent text-slate-800 ml-1 text-left", "cursor-default text-edge-outline font-display sm:text-7xl md:text-9xl ") },
                                    comdee_1.comdeeCompanyInfo.name,
                                    react_1.default.createElement("br", { className: "md:block hiidden" }),
                                    "Systems")),
                            react_1.default.createElement(tooltip_1.TooltipContent, { side: "top", className: "dark:bg-white dark:text-black" }, comdee_1.comdeeCompanyInfo.fullName))),
                    react_1.default.createElement(reveal_animations_1.BlurIn, { delay: 1.2 },
                        react_1.default.createElement("p", { className: (0, utils_1.cn)("md:self-start md:mt-4 font-thin text-md text-slate-500 dark:text-zinc-400 ml-3", "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text ") }, comdee_1.comdeeCompanyInfo.tagline))),
                react_1.default.createElement("div", { className: "mt-8 md:ml-2 flex flex-col gap-3" },
                    react_1.default.createElement(link_1.default, { href: comdee_1.comdeeCompanyInfo.website, target: "_blank", className: "flex-1" },
                        react_1.default.createElement(reveal_animations_1.BoxReveal, { delay: 2, width: "100%" },
                            react_1.default.createElement(button_1.Button, { className: "flex items-center gap-2 w-full" },
                                react_1.default.createElement(lucide_react_1.File, { size: 24 }),
                                react_1.default.createElement("p", null, "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17")))),
                    react_1.default.createElement("div", { className: "md:self-start flex gap-3" },
                        react_1.default.createElement(tooltip_1.Tooltip, { delayDuration: 300 },
                            react_1.default.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                react_1.default.createElement(link_1.default, { href: "#contact" },
                                    react_1.default.createElement(button_1.Button, { variant: "outline", className: "block w-full overflow-hidden" }, "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E40\u0E23\u0E32"))),
                            react_1.default.createElement(tooltip_1.TooltipContent, { side: "bottom" },
                                react_1.default.createElement("p", null, "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E2A\u0E2D\u0E1A\u0E16\u0E32\u0E21\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \uD83D\uDCDE"))),
                        react_1.default.createElement(link_1.default, { href: comdee_1.comdeeCompanyInfo.contact.social.facebook, target: "_blank" },
                            react_1.default.createElement(button_1.Button, { variant: "outline" },
                                react_1.default.createElement("span", { className: "text-sm font-medium" }, "FB"))),
                        react_1.default.createElement(link_1.default, { href: comdee_1.comdeeCompanyInfo.contact.social.line, target: "_blank" },
                            react_1.default.createElement(button_1.Button, { variant: "outline" },
                                react_1.default.createElement("span", { className: "text-sm font-medium" }, "LINE")))))))),
            react_1.default.createElement("div", { className: "grid col-span-1" })),
        react_1.default.createElement("div", { className: "absolute bottom-10 left-[50%] translate-x-[-50%]" },
            react_1.default.createElement(scroll_down_icon_1.default, null))));
};
exports.default = HeroSection;
