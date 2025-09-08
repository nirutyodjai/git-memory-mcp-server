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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const framer_motion_1 = require("framer-motion");
const react_1 = __importStar(require("react"));
const button_1 = require("../ui/button");
const si_1 = require("react-icons/si");
const config_1 = require("@/data/config");
const link_1 = __importDefault(require("next/link"));
const BUTTONS = [
    {
        name: "Github",
        href: config_1.config.social.github,
        icon: react_1.default.createElement(si_1.SiGithub, { size: "24", color: "#fff" }),
    },
    {
        name: "LinkedIn",
        href: config_1.config.social.linkedin,
        icon: react_1.default.createElement(si_1.SiLinkedin, { size: "24", color: "#fff" }),
    },
    {
        name: "Twitter",
        href: config_1.config.social.twitter,
        icon: react_1.default.createElement(si_1.SiTwitter, { size: "24", color: "#fff" }),
    },
    {
        name: "Instagram",
        href: config_1.config.social.instagram,
        icon: react_1.default.createElement(si_1.SiInstagram, { size: "24", color: "#fff" }),
    },
];
const SocialMediaButtons = () => {
    const ref = (0, react_1.useRef)(null);
    const show = (0, framer_motion_1.useInView)(ref, { once: true });
    return (react_1.default.createElement("div", { ref: ref, className: "z-10" }, show &&
        BUTTONS.map((button) => (react_1.default.createElement(link_1.default, { href: button.href, key: button.name, target: "_blank" },
            react_1.default.createElement(button_1.Button, { variant: "ghost" }, button.icon))))));
};
exports.default = SocialMediaButtons;
