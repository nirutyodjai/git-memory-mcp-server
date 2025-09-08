"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const card_1 = require("@/components/ui/card");
const ContactForm_1 = __importDefault(require("../ContactForm"));
const link_1 = __importDefault(require("next/link"));
const utils_1 = require("@/lib/utils");
const config_1 = require("@/data/config");
const ContactSection = () => {
    return (react_1.default.createElement("section", { id: "contact", className: "min-h-screen max-w-7xl mx-auto " },
        react_1.default.createElement(link_1.default, { href: "#contact" },
            react_1.default.createElement("h2", { className: (0, utils_1.cn)("bg-clip-text text-4xl text-center text-transparent md:text-7xl pt-16", "bg-gradient-to-b from-black/80 to-black/50", "dark:bg-gradient-to-b dark:from-white/80 dark:to-white/20 dark:bg-opacity-50") },
                "\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19 ",
                react_1.default.createElement("br", null),
                "\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19")),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 z-[9999]" },
            react_1.default.createElement(card_1.Card, { className: "min-w-7xl bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-xl mt-10 md:mt-20" },
                react_1.default.createElement(card_1.CardHeader, null,
                    react_1.default.createElement(card_1.CardTitle, { className: "text-4xl" }, "\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"),
                    react_1.default.createElement(card_1.CardDescription, null,
                        "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E40\u0E23\u0E32\u0E42\u0E14\u0E22\u0E15\u0E23\u0E07\u0E17\u0E35\u0E48",
                        " ",
                        react_1.default.createElement("a", { target: "_blank", href: `mailto:${config_1.config.email}`, className: "text-gray-200 cursor-can-hover rounded-lg" }, config_1.config.email.replace(/@/g, "(at)")),
                        " ",
                        "\u0E2B\u0E23\u0E37\u0E2D\u0E1D\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48")),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement(ContactForm_1.default, null))))));
};
exports.default = ContactSection;
