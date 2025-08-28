"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@/lib/utils");
const link_1 = __importDefault(require("next/link"));
const react_1 = __importDefault(require("react"));
const button_1 = require("../ui/button");
const lucide_react_1 = require("lucide-react");
const tooltip_1 = require("@/components/ui/tooltip");
const preloader_1 = require("../preloader");
const reveal_animations_1 = require("../reveal-animations");
const scroll_down_icon_1 = __importDefault(require("../scroll-down-icon"));
const comdee_1 = require("@/data/comdee");
const HeroSection = () => {
    const { isLoading } = (0, preloader_1.usePreloader)();
    return (<section id="hero" className={(0, utils_1.cn)("relative w-full h-screen")}>
      <div className="grid md:grid-cols-2">
        <div className={(0, utils_1.cn)("h-[calc(100dvh-3rem)] md:h-[calc(100dvh-4rem)] z-[2]", "col-span-1", "flex flex-col justify-start md:justify-center items-center md:items-start", "pt-28 sm:pt-0 sm:pb-32 md:p-24 lg:p-40 xl:p-48")}>
          {!isLoading && (<>
              <div className="">
                <reveal_animations_1.BlurIn delay={0.7}>
                  <p className={(0, utils_1.cn)("md:self-start mt-4 font-thin text-md text-slate-500 dark:text-zinc-400 ml-3", "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text ")}>
                    ยินดีต้อนรับสู่
                    <br className="md:hidden"/>
                  </p>
                </reveal_animations_1.BlurIn>
                <reveal_animations_1.BlurIn delay={1}>
                  <tooltip_1.Tooltip delayDuration={300}>
                    <tooltip_1.TooltipTrigger asChild>
                      <h1 className={(0, utils_1.cn)("font-thin text-6xl text-transparent text-slate-800 ml-1 text-left", "cursor-default text-edge-outline font-display sm:text-7xl md:text-9xl ")}>
                        {comdee_1.comdeeCompanyInfo.name}
                        <br className="md:block hiidden"/>
                        Systems
                        {/* PLEASE hello??

            <br className="md:block hiidden" />
            UNMUTE ME 😢😢 */}
                      </h1>
                    </tooltip_1.TooltipTrigger>
                    <tooltip_1.TooltipContent side="top" className="dark:bg-white dark:text-black">
                      {comdee_1.comdeeCompanyInfo.fullName}
                    </tooltip_1.TooltipContent>
                  </tooltip_1.Tooltip>
                </reveal_animations_1.BlurIn>
                {/* <div className="md:block hidden bg-gradient-to-r from-zinc-300/0 via-zinc-300/50 to-zinc-300/0 w-screen h-px animate-fade-right animate-glow" /> */}
                <reveal_animations_1.BlurIn delay={1.2}>
                  <p className={(0, utils_1.cn)("md:self-start md:mt-4 font-thin text-md text-slate-500 dark:text-zinc-400 ml-3", "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text ")}>
                    {comdee_1.comdeeCompanyInfo.tagline}
                  </p>
                </reveal_animations_1.BlurIn>
              </div>
              <div className="mt-8 md:ml-2 flex flex-col gap-3">
                <link_1.default href={comdee_1.comdeeCompanyInfo.website} target="_blank" className="flex-1">
                  <reveal_animations_1.BoxReveal delay={2} width="100%">
                    <button_1.Button className="flex items-center gap-2 w-full">
                      <lucide_react_1.File size={24}/>
                      <p>เว็บไซต์บริษัท</p>
                    </button_1.Button>
                  </reveal_animations_1.BoxReveal>
                </link_1.default>
                <div className="md:self-start flex gap-3">
                  <tooltip_1.Tooltip delayDuration={300}>
                    <tooltip_1.TooltipTrigger asChild>
                      <link_1.default href={"#contact"}>
                        <button_1.Button variant={"outline"} className="block w-full overflow-hidden">
                          ติดต่อเรา
                        </button_1.Button>
                      </link_1.default>
                    </tooltip_1.TooltipTrigger>
                    <tooltip_1.TooltipContent side="bottom">
                      <p>ติดต่อสอบถามบริการ 📞</p>
                    </tooltip_1.TooltipContent>
                  </tooltip_1.Tooltip>
                  <link_1.default href={comdee_1.comdeeCompanyInfo.contact.social.facebook} target="_blank">
                    <button_1.Button variant={"outline"}>
                      <span className="text-sm font-medium">FB</span>
                    </button_1.Button>
                  </link_1.default>
                  <link_1.default href={comdee_1.comdeeCompanyInfo.contact.social.line} target="_blank">
                    <button_1.Button variant={"outline"}>
                      <span className="text-sm font-medium">LINE</span>
                    </button_1.Button>
                  </link_1.default>
                </div>
              </div>
            </>)}
        </div>
        <div className="grid col-span-1"></div>
      </div>
      <div className="absolute bottom-10 left-[50%] translate-x-[-50%]">
        <scroll_down_icon_1.default />
      </div>
    </section>);
};
exports.default = HeroSection;
//# sourceMappingURL=hero.js.map