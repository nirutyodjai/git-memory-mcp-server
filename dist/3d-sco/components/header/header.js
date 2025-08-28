"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const link_1 = __importDefault(require("next/link"));
const style_module_scss_1 = __importDefault(require("./style.module.scss"));
const anim_1 = require("./anim");
const nav_1 = __importDefault(require("./nav"));
const utils_1 = require("@/lib/utils");
const funny_theme_toggle_1 = __importDefault(require("../theme/funny-theme-toggle"));
const button_1 = require("../ui/button");
const config_1 = require("@/data/config");
const online_users_1 = __importDefault(require("../realtime/online-users"));
const user_auth_1 = require("@/contexts/user-auth");
const UserProfile_1 = __importDefault(require("../auth/UserProfile"));
const AuthModal_1 = __importDefault(require("../auth/AuthModal"));
const lucide_react_1 = require("lucide-react");
const Header = ({ loader }) => {
    const [isActive, setIsActive] = (0, react_1.useState)(false);
    const [showAuthModal, setShowAuthModal] = (0, react_1.useState)(false);
    const { user, loading } = (0, user_auth_1.useUserAuth)();
    return (<framer_motion_1.motion.header className={(0, utils_1.cn)(style_module_scss_1.default.header, "transition-colors delay-100 duration-500 ease-in")} style={{
            background: isActive ? "hsl(var(--background) / .8)" : "transparent",
            // backgroundImage:
            //   "linear-gradient(0deg, rgba(0, 0, 0, 0), rgb(0, 0, 0))",
        }} initial={{
            y: -80,
        }} animate={{
            y: 0,
        }} transition={{
            delay: loader ? 3.5 : 0, // 3.5 for loading, .5 can be added for delay
            duration: 0.8,
        }}>
      {/* <div
          className="absolute inset-0 "
          style={{
            mask: "linear-gradient(rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 12.5%)",
          }}
        >
        </div> */}
      <div className={(0, utils_1.cn)(style_module_scss_1.default.bar, "flex items-center justify-between")}>
        <link_1.default href="/" className="flex items-center justify-center">
          <button_1.Button variant={"link"} className="text-md">
            {config_1.config.author}
          </button_1.Button>
        </link_1.default>

        <online_users_1.default />
        
        {/* Authentication Section */}
        {!loading && (<div className="flex items-center gap-2 mr-2">
            {user ? (<UserProfile_1.default />) : (<button_1.Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)} className="flex items-center gap-2">
                <lucide_react_1.LogIn size={16}/>
                เข้าสู่ระบบ
              </button_1.Button>)}
          </div>)}
        
        <funny_theme_toggle_1.default className="w-6 h-6 mr-4"/>
        <button_1.Button variant={"ghost"} onClick={() => setIsActive(!isActive)} className={(0, utils_1.cn)(style_module_scss_1.default.el, "m-0 p-0 h-6 bg-transparent flex items-center justify-center")}>
          <div className="relative flex items-center">
            <framer_motion_1.motion.p variants={anim_1.opacity} animate={!isActive ? "open" : "closed"}>
              Menu
            </framer_motion_1.motion.p>
            <framer_motion_1.motion.p variants={anim_1.opacity} animate={isActive ? "open" : "closed"}>
              Close
            </framer_motion_1.motion.p>
          </div>
          <div className={`${style_module_scss_1.default.burger} ${isActive ? style_module_scss_1.default.burgerActive : ""}`}></div>
        </button_1.Button>
      </div>
      <framer_motion_1.motion.div variants={anim_1.background} initial="initial" animate={isActive ? "open" : "closed"} className={style_module_scss_1.default.background}></framer_motion_1.motion.div>
      <framer_motion_1.AnimatePresence mode="wait">
        {isActive && <nav_1.default setIsActive={setIsActive}/>}
      </framer_motion_1.AnimatePresence>
      
      {/* Auth Modal */}
      <AuthModal_1.default isOpen={showAuthModal} onClose={() => setShowAuthModal(false)}/>
    </framer_motion_1.motion.header>);
};
exports.default = Header;
//# sourceMappingURL=header.js.map