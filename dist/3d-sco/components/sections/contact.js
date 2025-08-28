"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const card_1 = require("@/components/ui/card");
const ContactForm_1 = __importDefault(require("../ContactForm"));
const link_1 = __importDefault(require("next/link"));
const utils_1 = require("@/lib/utils");
const config_1 = require("@/data/config");
const ContactSection = () => {
    return (<section id="contact" className="min-h-screen max-w-7xl mx-auto ">
      <link_1.default href={"#contact"}>
        <h2 className={(0, utils_1.cn)("bg-clip-text text-4xl text-center text-transparent md:text-7xl pt-16", "bg-gradient-to-b from-black/80 to-black/50", "dark:bg-gradient-to-b dark:from-white/80 dark:to-white/20 dark:bg-opacity-50")}>
มาทำงาน <br />
ร่วมกัน
        </h2>
      </link_1.default>
      <div className="grid grid-cols-1 md:grid-cols-2 z-[9999]">
        <card_1.Card className="min-w-7xl bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-xl mt-10 md:mt-20">
          <card_1.CardHeader>
            <card_1.CardTitle className="text-4xl">แบบฟอร์มติดต่อ</card_1.CardTitle>
            <card_1.CardDescription>
              กรุณาติดต่อเราโดยตรงที่{" "}
              <a target="_blank" href={`mailto:${config_1.config.email}`} className="text-gray-200 cursor-can-hover rounded-lg">
                {config_1.config.email.replace(/@/g, "(at)")}
              </a>{" "}
หรือฝากข้อมูลของคุณไว้ที่นี่
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <ContactForm_1.default />
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </section>);
};
exports.default = ContactSection;
//# sourceMappingURL=contact.js.map