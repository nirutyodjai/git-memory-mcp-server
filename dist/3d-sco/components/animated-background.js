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
const react_1 = __importStar(require("react"));
const gsap_1 = __importDefault(require("gsap"));
const ScrollTrigger_1 = require("gsap/ScrollTrigger");
const spline_wrapper_1 = __importDefault(require("./spline-wrapper"));
const constants_1 = require("@/data/constants");
const utils_1 = require("@/lib/utils");
const use_media_query_1 = require("@/hooks/use-media-query");
const preloader_1 = require("./preloader");
const next_themes_1 = require("next-themes");
const navigation_1 = require("next/navigation");
gsap_1.default.registerPlugin(ScrollTrigger_1.ScrollTrigger);
const STATES = {
    hero: {
        desktop: {
            scale: { x: 0.25, y: 0.25, z: 0.25 },
            position: { x: 400, y: -200, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
        },
        mobile: {
            scale: { x: 0.15, y: 0.15, z: 0.15 },
            position: { x: 0, y: -200, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
        },
    },
    about: {
        desktop: {
            scale: { x: 0.4, y: 0.4, z: 0.4 },
            position: { x: 0, y: -40, z: 0 },
            rotation: {
                x: 0,
                y: Math.PI / 12,
                z: 0,
            },
        },
        mobile: {
            scale: { x: 0.2, y: 0.2, z: 0.2 },
            position: { x: 0, y: -40, z: 0 },
            rotation: {
                x: 0,
                y: Math.PI / 6,
                z: 0,
            },
        },
    },
    skills: {
        desktop: {
            scale: { x: 0.4, y: 0.4, z: 0.4 },
            position: { x: 0, y: -40, z: 0 },
            rotation: {
                x: 0,
                y: Math.PI / 12,
                z: 0,
            },
        },
        mobile: {
            scale: { x: 0.2, y: 0.2, z: 0.2 },
            position: { x: 0, y: -40, z: 0 },
            rotation: {
                x: 0,
                y: Math.PI / 6,
                z: 0,
            },
        },
    },
    projects: {
        desktop: {
            scale: { x: 0.3, y: 0.3, z: 0.3 },
            position: { x: 0, y: -40, z: 0 },
            rotation: {
                x: Math.PI,
                y: Math.PI / 3,
                z: Math.PI,
            },
        },
        mobile: {
            scale: { x: 0.18, y: 0.18, z: 0.18 },
            position: { x: 0, y: 150, z: 0 },
            rotation: {
                x: Math.PI,
                y: Math.PI / 3,
                z: Math.PI,
            },
        },
    },
    contact: {
        desktop: {
            scale: { x: 0.3, y: 0.3, z: 0.3 },
            position: { x: 500, y: -250, z: 0 },
            rotation: {
                x: 0,
                y: 0,
                z: 0,
            },
        },
        mobile: {
            scale: { x: 0.18, y: 0.18, z: 0.18 },
            position: { x: 0, y: 150, z: 0 },
            rotation: {
                x: Math.PI,
                y: Math.PI / 3,
                z: Math.PI,
            },
        },
    },
};
const AnimatedBackground = () => {
    const { isLoading, bypassLoading } = (0, preloader_1.usePreloader)();
    const { theme } = (0, next_themes_1.useTheme)();
    const isMobile = (0, use_media_query_1.useMediaQuery)("(max-width: 768px)");
    const splineContainer = (0, react_1.useRef)(null);
    const [splineApp, setSplineApp] = (0, react_1.useState)();
    const [selectedSkill, setSelectedSkill] = (0, react_1.useState)(null);
    const [activeSection, setActiveSection] = (0, react_1.useState)("hero");
    const [bongoAnimation, setBongoAnimation] = (0, react_1.useState)();
    const [keycapAnimtations, setKeycapAnimtations] = (0, react_1.useState)();
    const keyboardStates = (section) => {
        return STATES[section][isMobile ? "mobile" : "desktop"];
    };
    const handleMouseHover = (e) => {
        if (!splineApp || selectedSkill?.name === e.target.name)
            return;
        if (e.target.name === "body" || e.target.name === "platform") {
            setSelectedSkill(null);
            if (splineApp.getVariable("heading") && splineApp.getVariable("desc")) {
                splineApp.setVariable("heading", "");
                splineApp.setVariable("desc", "");
            }
        }
        else {
            if (!selectedSkill || selectedSkill.name !== e.target.name) {
                const skill = constants_1.SKILLS[e.target.name];
                setSelectedSkill(skill);
            }
        }
    };
    // handle keyboard press interaction
    (0, react_1.useEffect)(() => {
        if (!selectedSkill || !splineApp)
            return;
        splineApp.setVariable("heading", selectedSkill.label);
        splineApp.setVariable("desc", selectedSkill.shortDescription);
    }, [selectedSkill]);
    // handle keyboard heading and desc visibility
    (0, react_1.useEffect)(() => {
        if (!splineApp)
            return;
        const textDesktopDark = splineApp.findObjectByName("text-desktop-dark");
        const textDesktopLight = splineApp.findObjectByName("text-desktop");
        const textMobileDark = splineApp.findObjectByName("text-mobile-dark");
        const textMobileLight = splineApp.findObjectByName("text-mobile");
        if (!textDesktopDark ||
            !textDesktopLight ||
            !textMobileDark ||
            !textMobileLight)
            return;
        if (activeSection !== "skills") {
            textDesktopDark.visible = false;
            textDesktopLight.visible = false;
            textMobileDark.visible = false;
            textMobileLight.visible = false;
            return;
        }
        if (theme === "dark" && !isMobile) {
            textDesktopDark.visible = false;
            textDesktopLight.visible = true;
            textMobileDark.visible = false;
            textMobileLight.visible = false;
        }
        else if (theme === "dark" && isMobile) {
            textDesktopDark.visible = false;
            textDesktopLight.visible = false;
            textMobileDark.visible = false;
            textMobileLight.visible = true;
        }
        else if (theme === "light" && !isMobile) {
            textDesktopDark.visible = true;
            textDesktopLight.visible = false;
            textMobileDark.visible = false;
            textMobileLight.visible = false;
        }
        else {
            textDesktopDark.visible = false;
            textDesktopLight.visible = false;
            textMobileDark.visible = true;
            textMobileLight.visible = false;
        }
    }, [theme, splineApp, isMobile, activeSection]);
    // initialize gsap animations
    (0, react_1.useEffect)(() => {
        handleSplineInteractions();
        handleGsapAnimations();
        setBongoAnimation(getBongoAnimation());
        setKeycapAnimtations(getKeycapsAnimation());
    }, [splineApp]);
    (0, react_1.useEffect)(() => {
        let rotateKeyboard;
        let teardownKeyboard;
        (async () => {
            if (!splineApp)
                return;
            const kbd = splineApp.findObjectByName("keyboard");
            if (!kbd)
                return;
            rotateKeyboard = gsap_1.default.to(kbd.rotation, {
                y: Math.PI * 2 + kbd.rotation.y,
                duration: 10,
                repeat: -1,
                yoyo: true,
                yoyoEase: true,
                ease: "back.inOut",
                delay: 2.5,
            });
            teardownKeyboard = gsap_1.default.fromTo(kbd.rotation, {
                y: 0,
                // x: -Math.PI,
                x: -Math.PI,
                z: 0,
            }, {
                y: -Math.PI / 2,
                duration: 5,
                repeat: -1,
                yoyo: true,
                yoyoEase: true,
                // ease: "none",
                delay: 2.5,
                immediateRender: false,
                paused: true,
            });
            if (activeSection === "hero") {
                rotateKeyboard.restart();
                teardownKeyboard.pause();
            }
            else if (activeSection === "contact") {
                rotateKeyboard.pause();
            }
            else {
                rotateKeyboard.pause();
                teardownKeyboard.pause();
            }
            if (activeSection === "skills") {
            }
            else {
                splineApp.setVariable("heading", "");
                splineApp.setVariable("desc", "");
            }
            if (activeSection === "projects") {
                await (0, utils_1.sleep)(300);
                bongoAnimation?.start();
            }
            else {
                await (0, utils_1.sleep)(200);
                bongoAnimation?.stop();
            }
            if (activeSection === "contact") {
                await (0, utils_1.sleep)(600);
                teardownKeyboard.restart();
                keycapAnimtations?.start();
            }
            else {
                await (0, utils_1.sleep)(600);
                teardownKeyboard.pause();
                keycapAnimtations?.stop();
            }
        })();
        return () => {
            if (rotateKeyboard)
                rotateKeyboard.kill();
            if (teardownKeyboard)
                teardownKeyboard.kill();
        };
    }, [activeSection, splineApp]);
    const [keyboardRevealed, setKeyboardRevealed] = (0, react_1.useState)(false);
    const router = (0, navigation_1.useRouter)();
    //reveal keycaps
    (0, react_1.useEffect)(() => {
        const hash = activeSection === "hero" ? "#" : `#${activeSection}`;
        router.push("/" + hash, { scroll: false });
        if (!splineApp || isLoading || keyboardRevealed)
            return;
        revealKeyCaps();
    }, [splineApp, isLoading, activeSection]);
    const revealKeyCaps = async () => {
        if (!splineApp)
            return;
        const kbd = splineApp.findObjectByName("keyboard");
        if (!kbd)
            return;
        kbd.visible = false;
        await (0, utils_1.sleep)(400);
        kbd.visible = true;
        setKeyboardRevealed(true);
        console.log(activeSection);
        gsap_1.default.fromTo(kbd?.scale, { x: 0.01, y: 0.01, z: 0.01 }, {
            x: keyboardStates(activeSection).scale.x,
            y: keyboardStates(activeSection).scale.y,
            z: keyboardStates(activeSection).scale.z,
            duration: 1.5,
            ease: "elastic.out(1, 0.6)",
        });
        // }
        const allObjects = splineApp.getAllObjects();
        const keycaps = allObjects.filter((obj) => obj.name === "keycap");
        await (0, utils_1.sleep)(900);
        if (isMobile) {
            const mobileKeyCaps = allObjects.filter((obj) => obj.name === "keycap-mobile");
            mobileKeyCaps.forEach((keycap, idx) => {
                keycap.visible = true;
            });
        }
        else {
            const desktopKeyCaps = allObjects.filter((obj) => obj.name === "keycap-desktop");
            desktopKeyCaps.forEach(async (keycap, idx) => {
                await (0, utils_1.sleep)(idx * 70);
                keycap.visible = true;
            });
        }
        keycaps.forEach(async (keycap, idx) => {
            keycap.visible = false;
            await (0, utils_1.sleep)(idx * 70);
            keycap.visible = true;
            gsap_1.default.fromTo(keycap.position, { y: 200 }, { y: 50, duration: 0.5, delay: 0.1, ease: "bounce.out" });
        });
    };
    const handleSplineInteractions = () => {
        if (!splineApp)
            return;
        splineApp.addEventListener("keyUp", (e) => {
            if (!splineApp)
                return;
            splineApp.setVariable("heading", "");
            splineApp.setVariable("desc", "");
        });
        splineApp.addEventListener("keyDown", (e) => {
            if (!splineApp)
                return;
            const skill = constants_1.SKILLS[e.target.name];
            if (skill)
                setSelectedSkill(skill);
            splineApp.setVariable("heading", skill.label);
            splineApp.setVariable("desc", skill.shortDescription);
        });
        splineApp.addEventListener("mouseHover", handleMouseHover);
    };
    const handleGsapAnimations = () => {
        if (!splineApp)
            return;
        const kbd = splineApp.findObjectByName("keyboard");
        if (!kbd || !splineContainer.current)
            return;
        gsap_1.default.set(kbd.scale, {
            ...keyboardStates("hero").scale,
        });
        gsap_1.default.set(kbd.position, {
            ...keyboardStates("hero").position,
        });
        gsap_1.default.timeline({
            scrollTrigger: {
                trigger: "#skills",
                start: "top 50%",
                end: "bottom bottom",
                scrub: true,
                // markers: true,
                onEnter: () => {
                    setActiveSection("skills");
                    gsap_1.default.to(kbd.scale, {
                        ...keyboardStates("skills").scale,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.position, {
                        ...keyboardStates("skills").position,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.rotation, {
                        ...keyboardStates("skills").rotation,
                        duration: 1,
                    });
                },
                onLeaveBack: () => {
                    setActiveSection("hero");
                    gsap_1.default.to(kbd.scale, { ...keyboardStates("hero").scale, duration: 1 });
                    gsap_1.default.to(kbd.position, {
                        ...keyboardStates("hero").position,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.rotation, {
                        ...keyboardStates("hero").rotation,
                        duration: 1,
                    });
                    // gsap.to(kbd.rotation, { x: 0, duration: 1 });
                },
            },
        });
        gsap_1.default.timeline({
            scrollTrigger: {
                trigger: "#projects",
                start: "top 70%",
                end: "bottom bottom",
                scrub: true,
                // markers: true,
                onEnter: () => {
                    setActiveSection("projects");
                    gsap_1.default.to(kbd.scale, {
                        ...keyboardStates("projects").scale,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.position, {
                        ...keyboardStates("projects").position,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.rotation, {
                        ...keyboardStates("projects").rotation,
                        duration: 1,
                    });
                },
                onLeaveBack: () => {
                    setActiveSection("skills");
                    gsap_1.default.to(kbd.scale, {
                        ...keyboardStates("skills").scale,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.position, {
                        ...keyboardStates("skills").position,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.rotation, {
                        ...keyboardStates("skills").rotation,
                        duration: 1,
                    });
                    // gsap.to(kbd.rotation, { x: 0, duration: 1 });
                },
            },
        });
        gsap_1.default.timeline({
            scrollTrigger: {
                trigger: "#contact",
                start: "top 30%",
                end: "bottom bottom",
                scrub: true,
                // markers: true,
                onEnter: () => {
                    setActiveSection("contact");
                    gsap_1.default.to(kbd.scale, {
                        ...keyboardStates("contact").scale,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.position, {
                        ...keyboardStates("contact").position,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.rotation, {
                        ...keyboardStates("contact").rotation,
                        duration: 1,
                    });
                },
                onLeaveBack: () => {
                    setActiveSection("projects");
                    gsap_1.default.to(kbd.scale, {
                        ...keyboardStates("projects").scale,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.position, {
                        ...keyboardStates("projects").position,
                        duration: 1,
                    });
                    gsap_1.default.to(kbd.rotation, {
                        ...keyboardStates("projects").rotation,
                        duration: 1,
                    });
                    // gsap.to(kbd.rotation, { x: 0, duration: 1 });
                },
            },
        });
    };
    const getBongoAnimation = () => {
        const framesParent = splineApp?.findObjectByName("bongo-cat");
        const frame1 = splineApp?.findObjectByName("frame-1");
        const frame2 = splineApp?.findObjectByName("frame-2");
        if (!frame1 || !frame2 || !framesParent)
            return { start: () => { }, stop: () => { } };
        let interval;
        const start = () => {
            let i = 0;
            framesParent.visible = true;
            interval = setInterval(() => {
                if (i % 2) {
                    frame1.visible = false;
                    frame2.visible = true;
                }
                else {
                    frame1.visible = true;
                    frame2.visible = false;
                }
                i++;
            }, 100);
        };
        const stop = () => {
            clearInterval(interval);
            framesParent.visible = false;
            frame1.visible = false;
            frame2.visible = false;
        };
        return { start, stop };
    };
    const getKeycapsAnimation = () => {
        if (!splineApp)
            return { start: () => { }, stop: () => { } };
        let tweens = [];
        const start = () => {
            removePrevTweens();
            Object.values(constants_1.SKILLS)
                .sort(() => Math.random() - 0.5)
                .forEach((skill, idx) => {
                const keycap = splineApp.findObjectByName(skill.name);
                if (!keycap)
                    return;
                const t = gsap_1.default.to(keycap?.position, {
                    y: Math.random() * 200 + 200,
                    duration: Math.random() * 2 + 2,
                    delay: idx * 0.6,
                    repeat: -1,
                    yoyo: true,
                    yoyoEase: "none",
                    ease: "elastic.out(1,0.3)",
                });
                tweens.push(t);
            });
        };
        const stop = () => {
            removePrevTweens();
            Object.values(constants_1.SKILLS).forEach((skill) => {
                const keycap = splineApp.findObjectByName(skill.name);
                if (!keycap)
                    return;
                const t = gsap_1.default.to(keycap?.position, {
                    y: 0,
                    duration: 4,
                    repeat: 1,
                    ease: "elastic.out(1,0.8)",
                });
                tweens.push(t);
            });
            setTimeout(removePrevTweens, 1000);
        };
        const removePrevTweens = () => {
            tweens.forEach((t) => t.kill());
        };
        return { start, stop };
    };
    return (<>
      <spline_wrapper_1.default ref={splineContainer} scene="/assets/skills-keyboard.spline" onLoad={(app) => {
            setSplineApp(app);
            bypassLoading();
        }} onError={(error) => {
            console.error('Spline loading error:', error);
            bypassLoading(); // Continue even if Spline fails
        }}/>
    </>);
};
exports.default = AnimatedBackground;
//# sourceMappingURL=animated-background.js.map