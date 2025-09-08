"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FunnyThemeToggle;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const next_themes_1 = require("next-themes");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
const use_toast_1 = require("../ui/use-toast");
const constants_1 = require("@/data/constants");
const popover_1 = require("../ui/popover");
function FunnyThemeToggle({ className, }) {
    const { setTheme, theme } = (0, next_themes_1.useTheme)();
    const [counter, setCounter] = React.useState({ dark: 0, light: 0 });
    const { toast } = (0, use_toast_1.useToast)();
    const goLight = () => {
        setCounter({ ...counter, light: counter.light + 1 });
        setTheme("light");
    };
    const goDark = () => {
        const description = constants_1.themeDisclaimers.dark[counter.dark % constants_1.themeDisclaimers.dark.length];
        setCounter({ ...counter, dark: counter.dark + 1 });
        toast({
            description: description,
            className: "top-0 right-0 flex fixed md:max-w-[420px] md:top-16 md:right-4",
        });
        setTheme("dark");
    };
    return (React.createElement(React.Fragment, null, theme === "light" ? (React.createElement(button_1.Button, { variant: "outline", size: "icon", className: (0, utils_1.cn)("border-none bg-transparent", className), onClick: goDark },
        React.createElement(lucide_react_1.Sun, { className: "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 pointer-events-none" }),
        React.createElement(lucide_react_1.Moon, { className: "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 pointer-events-none" }),
        React.createElement("span", { className: "sr-only" }, "Toggle theme"))) : (React.createElement(popover_1.Popover, null,
        React.createElement(popover_1.PopoverTrigger, { asChild: true },
            React.createElement(button_1.Button, { variant: "outline", size: "icon", className: (0, utils_1.cn)("border-none bg-transparent", className) },
                React.createElement(lucide_react_1.Sun, { className: "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" }),
                React.createElement(lucide_react_1.Moon, { className: "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" }),
                React.createElement("span", { className: "sr-only" }, "Toggle theme"))),
        React.createElement(popover_1.PopoverContent, { className: "z-[99999] flex flex-col items-center gap-2" },
            React.createElement("p", { className: "text-sm text-center" }, constants_1.themeDisclaimers.light[counter.light]),
            React.createElement(button_1.Button, { onClick: goLight }, "Go Light"))))));
}
