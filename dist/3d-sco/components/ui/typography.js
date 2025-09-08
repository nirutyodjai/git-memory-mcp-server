"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypographyH1 = TypographyH1;
exports.TypographyH2 = TypographyH2;
exports.TypographyH3 = TypographyH3;
exports.TypographyH4 = TypographyH4;
exports.TypographyP = TypographyP;
exports.TypographyBlockquote = TypographyBlockquote;
exports.TypographyTable = TypographyTable;
exports.TypographyList = TypographyList;
exports.TypographyInlineCode = TypographyInlineCode;
exports.TypographyLead = TypographyLead;
exports.TypographyLarge = TypographyLarge;
exports.TypographySmall = TypographySmall;
exports.TypographyMuted = TypographyMuted;
const utils_1 = require("@/lib/utils");
function TypographyH1({ children, className, }) {
    return (React.createElement("h1", { className: (0, utils_1.cn)("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", className) }, children));
}
function TypographyH2({ children, className, }) {
    return (React.createElement("h2", { className: (0, utils_1.cn)("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0", className) }, children));
}
function TypographyH3({ children, className, }) {
    return (React.createElement("h3", { className: (0, utils_1.cn)("scroll-m-20 text-2xl font-semibold tracking-tight", className) }, children));
}
function TypographyH4({ children, className, }) {
    return (React.createElement("h4", { className: (0, utils_1.cn)("scroll-m-20 text-xl font-semibold tracking-tight", className) }, children));
}
function TypographyP({ children, className, }) {
    return (React.createElement("p", { className: (0, utils_1.cn)("leading-7 [&:not(:first-child)]:mt-6", className) }, children));
}
function TypographyBlockquote({ children, className, }) {
    return (React.createElement("blockquote", { className: (0, utils_1.cn)("mt-6 border-l-2 pl-6 italic", className) }, children));
}
function TypographyTable({ children, className, }) {
    return (React.createElement("div", { className: (0, utils_1.cn)("my-6 w-full overflow-y-auto", className) },
        React.createElement("table", { className: (0, utils_1.cn)("w-full") },
            React.createElement("thead", null,
                React.createElement("tr", { className: (0, utils_1.cn)("m-0 border-t p-0 even:bg-muted") },
                    React.createElement("th", { className: (0, utils_1.cn)("border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right") }, "King's Treasury"),
                    React.createElement("th", { className: (0, utils_1.cn)("border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right") }, "People's happiness"))),
            React.createElement("tbody", null,
                React.createElement("tr", { className: (0, utils_1.cn)("m-0 border-t p-0 even:bg-muted") },
                    React.createElement("td", { className: (0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right") }, "Empty"),
                    React.createElement("td", { className: (0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right") }, "Overflowing")),
                React.createElement("tr", { className: (0, utils_1.cn)("m-0 border-t p-0 even:bg-muted") },
                    React.createElement("td", { className: (0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right") }, "Modest"),
                    React.createElement("td", { className: (0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right") }, "Satisfied")),
                React.createElement("tr", { className: (0, utils_1.cn)("m-0 border-t p-0 even:bg-muted") },
                    React.createElement("td", { className: (0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right") }, "Full"),
                    React.createElement("td", { className: (0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right") }, "Ecstatic"))))));
}
function TypographyList({ children, className, }) {
    return (React.createElement("ul", { className: (0, utils_1.cn)("my-6 ml-6 list-disc [&>li]:mt-2", className) }, children));
}
function TypographyInlineCode({ children, className, }) {
    return (React.createElement("code", { className: (0, utils_1.cn)("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className) }, children));
}
function TypographyLead({ children, className, }) {
    return (React.createElement("p", { className: (0, utils_1.cn)("text-xl text-muted-foreground", className) }, children));
}
function TypographyLarge({ children, className, }) {
    return (React.createElement("div", { className: (0, utils_1.cn)("text-lg font-semibold", className) }, children));
}
function TypographySmall({ children, className, }) {
    return (React.createElement("small", { className: (0, utils_1.cn)("text-sm font-medium leading-none", className) }, children));
}
function TypographyMuted({ children, className, }) {
    return (React.createElement("p", { className: (0, utils_1.cn)("text-sm text-muted-foreground", className) }, children));
}
