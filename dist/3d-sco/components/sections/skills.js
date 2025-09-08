"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const react_1 = __importDefault(require("react"));
const reveal_animations_1 = require("../reveal-animations");
const utils_1 = require("@/lib/utils");
const SkillsSection = () => {
    return (react_1.default.createElement("section", { id: "skills", className: "w-full h-screen md:h-[150dvh]" },
        react_1.default.createElement("div", { className: "top-[70px] sticky mb-96" },
            react_1.default.createElement(link_1.default, { href: "#skills" },
                react_1.default.createElement(reveal_animations_1.BoxReveal, { width: "100%" },
                    react_1.default.createElement("h2", { className: (0, utils_1.cn)("bg-clip-text text-4xl text-center text-transparent md:text-7xl", "bg-gradient-to-b from-black/80 to-black/50", "dark:bg-gradient-to-b dark:from-white/80 dark:to-white/20 dark:bg-opacity-50 ") }, "\u0E17\u0E31\u0E01\u0E29\u0E30\u0E15\u0E48\u0E32\u0E07\u0E46"))),
            react_1.default.createElement("p", { className: "mx-auto mt-4 line-clamp-4 max-w-3xl font-normal text-base text-center text-neutral-300" }, "(\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33: \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E43\u0E14\u0E01\u0E47\u0E44\u0E14\u0E49)"))));
};
exports.default = SkillsSection;
