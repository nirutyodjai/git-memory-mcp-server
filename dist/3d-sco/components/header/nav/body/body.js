"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Body;
const framer_motion_1 = require("framer-motion");
const link_1 = __importDefault(require("next/link"));
const style_module_scss_1 = __importDefault(require("./style.module.scss"));
const anim_1 = require("../../anim");
const utils_1 = require("@/lib/utils");
const navigation_1 = require("next/navigation");
const react_1 = require("react");
const i18n_provider_1 = require("@/components/providers/i18n-provider");
function Body({ links, selectedLink, setSelectedLink, setIsActive, }) {
    const params = (0, navigation_1.useParams)();
    const [currentHref, setCurrentHref] = (0, react_1.useState)("/");
    const { t } = (0, i18n_provider_1.useI18n)();
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        const { pathname, hash } = window.location;
        setCurrentHref(pathname + hash);
    }, [params]);
    const getChars = (word) => {
        let chars = [];
        word.split("").forEach((char, i) => {
            chars.push(<framer_motion_1.motion.span className="pointer-events-none" custom={[i * 0.02, (word.length - i) * 0.01]} variants={anim_1.translate} initial="initial" animate="enter" exit="exit" key={char + i}>
          {char}
        </framer_motion_1.motion.span>);
        });
        return chars;
    };
    return (<div className={(0, utils_1.cn)(style_module_scss_1.default.body, "flex flex-col items-end md:flex-row")}>
      {links.map((link, index) => {
            const { title, href, target } = link;
            return (<link_1.default key={`l_${index}`} href={href} target={target} className="cursor-can-hover rounded-lg">
            <framer_motion_1.motion.p className={(0, utils_1.cn)("rounded-lg", currentHref !== href ? "text-muted-foreground" : "underline")} onClick={() => setIsActive(false)} onMouseOver={() => setSelectedLink({ isActive: true, index })} onMouseLeave={() => setSelectedLink({ isActive: false, index })} variants={anim_1.blur} animate={selectedLink.isActive && selectedLink.index !== index
                    ? "open"
                    : "closed"}>
              {getChars(t(title, 'navigation'))}
            </framer_motion_1.motion.p>
          </link_1.default>);
        })}
    </div>);
}
//# sourceMappingURL=body.js.map