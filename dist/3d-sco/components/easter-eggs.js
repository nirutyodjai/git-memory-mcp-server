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
const use_devtools_open_1 = require("@/hooks/use-devtools-open");
const react_1 = __importStar(require("react"));
const nyan_cat_1 = __importDefault(require("./nyan-cat"));
const EasterEggs = () => {
    const { isDevToolsOpen } = (0, use_devtools_open_1.useDevToolsOpen)();
    (0, react_1.useEffect)(() => {
        if (!isDevToolsOpen)
            return;
        // console.log(
        //   "%cWhoa, look at you! 🕵️‍♂️\n\n" +
        //     "Peeking under the hood, eh? Just be careful, " +
        //     "you might find some 🐛 bugs that even I didn't know about! 😅\n\n" +
        //     "By the way, did you know the console is a portal to another dimension? 🌌 " +
        //     "Just kidding... or am I? 👽\n\n" +
        //     "Keep exploring, brave soul! 🛠️",
        //   "color: #00FF00; font-size: 16px; font-weight: bold; background-color: black; padding: 10px; border-radius: 10px;"
        // );
        if (typeof console !== "undefined") {
            console.clear();
            console.log("%cWhoa, look at you! 🕵️‍♂️\n" +
                "You seem to have discovered the secret console! 🔍\n" +
                "Want to see some magic? ✨\n" +
                "Just type %cmy first name%c and hit enter! 🎩🐇", 
            //   "Just press the %c'n'%c key and watch the magic happen! 🪄",
            "color: #FFD700; font-size: 16px; font-weight: bold; background-color: black; padding: 10px; border-radius: 10px; margin-top:20px", "color: #00FF00; font-size: 16px; font-weight: bold; background-color: black; padding: 10px; border-radius: 10px; margin-top:20px", "color: #FFD700; font-size: 16px; font-weight: bold; background-color: black; padding: 10px; border-radius: 10px;");
            ["naresh", "Naresh", "NARESH"].forEach((name) => {
                // @ts-ignore
                if (Object.hasOwn(window, name))
                    return;
                Object.defineProperty(window, name, {
                    get() {
                        console.log("%c✨ Abra Kadabra! ✨\n\n" +
                            "You just summoned the magic of Naresh! 🧙‍♂️\n" +
                            "What??? youre not impressed? Fine, but remember: With great power comes great responsibility! 💻⚡", "color: #FF4500; font-size: 18px; font-weight: bold; background-color: black; padding: 10px; border-radius: 10px; margin-top:10px");
                        const timer = setTimeout(() => {
                            console.log("%cPssttt! 🤫\n\n" +
                                "Do you like cats?? 😺 If yes, then press 'n' on viewport and see what happens! 🐱✨", "color: #FF69B4; font-size: 16px; font-weight: bold; background-color: black; padding: 10px; border-radius: 10px;");
                            clearTimeout(timer);
                        }, 7000);
                        return "";
                    },
                });
            });
        }
    }, [isDevToolsOpen]);
    return (<>
      <nyan_cat_1.default />
    </>);
};
exports.default = EasterEggs;
//# sourceMappingURL=easter-eggs.js.map