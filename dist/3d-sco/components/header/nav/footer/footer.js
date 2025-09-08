"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Footer;
const style_module_scss_1 = __importDefault(require("./style.module.scss"));
const anim_1 = require("../../anim");
const framer_motion_1 = require("framer-motion");
function Footer() {
    return (React.createElement("div", { className: style_module_scss_1.default.footer },
        React.createElement("ul", null,
            React.createElement(framer_motion_1.motion.li, { custom: [0.3, 0], variants: anim_1.translate, initial: "initial", animate: "enter", exit: "exit" },
                React.createElement("span", null, "Inspired by:"),
                " Studio Lumio")),
        React.createElement("ul", null,
            React.createElement(framer_motion_1.motion.li, { custom: [0.3, 0], variants: anim_1.translate, initial: "initial", animate: "enter", exit: "exit" },
                React.createElement("span", null, "Typography:"),
                " Inter")),
        React.createElement("ul", null,
            React.createElement(framer_motion_1.motion.li, { custom: [0.3, 0], variants: anim_1.translate, initial: "initial", animate: "enter", exit: "exit" },
                React.createElement("span", null, "Images:"),
                " Unsplash")),
        React.createElement("ul", null,
            React.createElement(framer_motion_1.motion.li, { custom: [0.3, 0], variants: anim_1.translate, initial: "initial", animate: "enter", exit: "exit" }, "Blog"),
            React.createElement(framer_motion_1.motion.li, { custom: [0.3, 0], variants: anim_1.translate, initial: "initial", animate: "enter", exit: "exit" }, "Newsletter"))));
}
