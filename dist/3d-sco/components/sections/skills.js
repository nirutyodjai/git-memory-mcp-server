"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const react_1 = __importDefault(require("react"));
const reveal_animations_1 = require("../reveal-animations");
const utils_1 = require("@/lib/utils");
const SkillsSection = () => {
    return (<section id="skills" className="w-full h-screen md:h-[150dvh]">
      <div className="top-[70px] sticky mb-96">
        <link_1.default href={"#skills"}>
          <reveal_animations_1.BoxReveal width="100%">
            <h2 className={(0, utils_1.cn)("bg-clip-text text-4xl text-center text-transparent md:text-7xl", "bg-gradient-to-b from-black/80 to-black/50", "dark:bg-gradient-to-b dark:from-white/80 dark:to-white/20 dark:bg-opacity-50 ")}>
              ทักษะต่างๆ
            </h2>
          </reveal_animations_1.BoxReveal>
        </link_1.default>
        <p className="mx-auto mt-4 line-clamp-4 max-w-3xl font-normal text-base text-center text-neutral-300">
          (คำแนะนำ: กดปุ่มใดก็ได้)
        </p>
      </div>
    </section>);
};
exports.default = SkillsSection;
//# sourceMappingURL=skills.js.map