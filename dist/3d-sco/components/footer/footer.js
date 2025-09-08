"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const link_1 = __importDefault(require("next/link"));
const config_1 = require("./config");
const button_1 = require("../ui/button");
const social_media_icons_1 = __importDefault(require("../social/social-media-icons"));
const config_2 = require("@/data/config");
function Footer() {
    const year = new Date().getFullYear();
    return (react_1.default.createElement("footer", { className: "flex w-full shrink-0 flex-col items-center gap-2 border-t border-border px-4 py-6 sm:flex-row md:px-6 sm:justify-between" },
        react_1.default.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400" },
            "\u00A9 ",
            year,
            " ",
            config_2.config.author,
            ". All rights reserved."),
        react_1.default.createElement(social_media_icons_1.default, null),
        react_1.default.createElement("nav", { className: "flex gap-4 sm:gap-6 z-10" }, config_1.footer.map((link, index) => {
            const { title, href } = link;
            return (react_1.default.createElement(link_1.default, { className: "text-xs underline-offset-4 hover:underline", href: href, key: `l_${index}` },
                react_1.default.createElement(button_1.Button, { variant: "link" }, title)));
        }))));
}
exports.default = Footer;
