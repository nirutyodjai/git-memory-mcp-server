"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const framer_motion_1 = require("framer-motion");
const image_1 = __importDefault(require("next/image"));
const style_module_scss_1 = __importDefault(require("./style.module.scss"));
const anim_1 = require("../../anim");
const Index = ({ src, isActive }) => {
    return (<framer_motion_1.motion.div variants={anim_1.opacity} initial="initial" animate={isActive ? "open" : "closed"} className={style_module_scss_1.default.imageContainer}>
      <image_1.default src={src} width={400} height={400} className="my-32 w-full h-auto object-cover" alt={"Image"}/>
    </framer_motion_1.motion.div>);
};
exports.default = Index;
//# sourceMappingURL=image.js.map