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
    return (<div className={style_module_scss_1.default.footer}>
      <ul>
        <framer_motion_1.motion.li custom={[0.3, 0]} variants={anim_1.translate} initial="initial" animate="enter" exit="exit">
          {/* space */}
          <span>Inspired by:</span> Studio Lumio
        </framer_motion_1.motion.li>
      </ul>
      <ul>
        <framer_motion_1.motion.li custom={[0.3, 0]} variants={anim_1.translate} initial="initial" animate="enter" exit="exit">
          <span>Typography:</span> Inter
        </framer_motion_1.motion.li>
      </ul>
      <ul>
        <framer_motion_1.motion.li custom={[0.3, 0]} variants={anim_1.translate} initial="initial" animate="enter" exit="exit">
          <span>Images:</span> Unsplash
        </framer_motion_1.motion.li>
      </ul>
      <ul>
        <framer_motion_1.motion.li custom={[0.3, 0]} variants={anim_1.translate} initial="initial" animate="enter" exit="exit">
          Blog
        </framer_motion_1.motion.li>
        <framer_motion_1.motion.li custom={[0.3, 0]} variants={anim_1.translate} initial="initial" animate="enter" exit="exit">
          Newsletter
        </framer_motion_1.motion.li>
      </ul>
    </div>);
}
//# sourceMappingURL=footer.js.map