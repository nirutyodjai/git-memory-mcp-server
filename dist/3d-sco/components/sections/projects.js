"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_1 = __importDefault(require("next/image"));
const react_1 = __importDefault(require("react"));
const animated_modal_1 = require("../ui/animated-modal");
const floating_dock_1 = require("../ui/floating-dock");
const link_1 = __importDefault(require("next/link"));
const smooth_scroll_1 = __importDefault(require("../smooth-scroll"));
const projects_1 = __importDefault(require("@/data/projects"));
const utils_1 = require("@/lib/utils");
const ProjectsSection = () => {
    return (react_1.default.createElement("section", { id: "projects", className: "max-w-7xl mx-auto md:h-[130vh]" },
        react_1.default.createElement(link_1.default, { href: "#projects" },
            react_1.default.createElement("h2", { className: (0, utils_1.cn)("bg-clip-text text-4xl text-center text-transparent md:text-7xl pt-16", "bg-gradient-to-b from-black/80 to-black/50", "dark:bg-gradient-to-b dark:from-white/80 dark:to-white/20 dark:bg-opacity-50 mb-32") }, "\u0E1C\u0E25\u0E07\u0E32\u0E19")),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3" }, projects_1.default.map((project, index) => (react_1.default.createElement(Modall, { key: project.src, project: project }))))));
};
const Modall = ({ project }) => {
    return (react_1.default.createElement("div", { className: "flex items-center justify-center" },
        react_1.default.createElement(animated_modal_1.Modal, null,
            react_1.default.createElement(animated_modal_1.ModalTrigger, { className: "bg-transparent flex justify-center group/modal-btn" },
                react_1.default.createElement("div", { className: "relative w-[400px] h-auto rounded-lg overflow-hidden", style: { aspectRatio: "3/2" } },
                    react_1.default.createElement(image_1.default, { className: "absolute w-full h-full top-0 left-0 hover:scale-[1.05] transition-all", src: project.src, alt: project.title, width: 300, height: 300 }),
                    react_1.default.createElement("div", { className: "absolute w-full h-1/2 bottom-0 left-0 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none" },
                        react_1.default.createElement("div", { className: "flex flex-col h-full items-start justify-end p-6" },
                            react_1.default.createElement("div", { className: "text-lg text-left" }, project.title),
                            react_1.default.createElement("div", { className: "text-xs bg-white text-black rounded-lg w-fit px-2" }, project.category))))),
            react_1.default.createElement(animated_modal_1.ModalBody, { className: "md:max-w-4xl md:max-h-[80%] overflow-auto" },
                react_1.default.createElement(smooth_scroll_1.default, { isInsideModal: true },
                    react_1.default.createElement(animated_modal_1.ModalContent, null,
                        react_1.default.createElement(ProjectContents, { project: project }))),
                react_1.default.createElement(animated_modal_1.ModalFooter, { className: "gap-4" },
                    react_1.default.createElement("button", { className: "px-2 py-1 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm w-28" }, "Cancel"),
                    react_1.default.createElement(link_1.default, { href: project.live, target: "_blank" },
                        react_1.default.createElement("button", { className: "bg-black text-white dark:bg-white dark:text-black text-sm px-2 py-1 rounded-md border border-black w-28" }, "Visit")))))));
};
exports.default = ProjectsSection;
const ProjectContents = ({ project }) => {
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("h4", { className: "text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8" }, project.title),
        react_1.default.createElement("div", { className: "flex flex-col md:flex-row md:justify-evenly max-w-screen overflow-hidden md:overflow-visible" },
            react_1.default.createElement("div", { className: "flex flex-row md:flex-col-reverse justify-center items-center gap-2 text-3xl mb-8" },
                react_1.default.createElement("p", { className: "text-sm mt-1 text-neutral-600 dark:text-neutral-500" }, "Frontend"),
                project.skills.frontend?.length > 0 && (react_1.default.createElement(floating_dock_1.FloatingDock, { items: project.skills.frontend }))),
            project.skills.backend?.length > 0 && (react_1.default.createElement("div", { className: "flex flex-row md:flex-col-reverse justify-center items-center gap-2 text-3xl mb-8" },
                react_1.default.createElement("p", { className: "text-sm mt-1 text-neutral-600 dark:text-neutral-500" }, "Backend"),
                react_1.default.createElement(floating_dock_1.FloatingDock, { items: project.skills.backend })))),
        project.content));
};
