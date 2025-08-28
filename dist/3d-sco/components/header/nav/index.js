"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const style_module_scss_1 = __importDefault(require("./style.module.scss"));
const anim_1 = require("../anim");
const body_1 = __importDefault(require("./body/body"));
const image_1 = __importDefault(require("./image/image"));
const config_1 = require("@/components/header/config");
const utils_1 = require("@/lib/utils");
const Index = ({ setIsActive }) => {
    const [selectedLink, setSelectedLink] = (0, react_1.useState)({
        isActive: false,
        index: 0,
    });
    return (<framer_motion_1.motion.div variants={anim_1.height} initial="initial" animate="enter" exit="exit" className={style_module_scss_1.default.nav}>
      <div className={(0, utils_1.cn)(style_module_scss_1.default.wrapper, 'flex justify-end sm:justify-start')}>
        <div className={style_module_scss_1.default.container}>
          <body_1.default links={config_1.links} selectedLink={selectedLink} setSelectedLink={setSelectedLink} setIsActive={setIsActive}/>
          {/* <Footer /> */}
        </div>
        <image_1.default src={config_1.links[selectedLink.index].thumbnail} isActive={selectedLink.isActive}/>
        {/* <p>{links[selectedLink.index].thumbnail}</p> */}
      </div>
    </framer_motion_1.motion.div>);
};
exports.default = Index;
//# sourceMappingURL=index.js.map