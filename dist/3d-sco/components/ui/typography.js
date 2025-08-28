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
    return (<h1 className={(0, utils_1.cn)("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", className)}>
      {children}
    </h1>);
}
function TypographyH2({ children, className, }) {
    return (<h2 className={(0, utils_1.cn)("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0", className)}>
      {children}
    </h2>);
}
function TypographyH3({ children, className, }) {
    return (<h3 className={(0, utils_1.cn)("scroll-m-20 text-2xl font-semibold tracking-tight", className)}>
      {children}
    </h3>);
}
function TypographyH4({ children, className, }) {
    return (<h4 className={(0, utils_1.cn)("scroll-m-20 text-xl font-semibold tracking-tight", className)}>
      {children}
    </h4>);
}
function TypographyP({ children, className, }) {
    return (<p className={(0, utils_1.cn)("leading-7 [&:not(:first-child)]:mt-6", className)}>
      {children}
    </p>);
}
function TypographyBlockquote({ children, className, }) {
    return (<blockquote className={(0, utils_1.cn)("mt-6 border-l-2 pl-6 italic", className)}>
      {children}
    </blockquote>);
}
function TypographyTable({ children, className, }) {
    return (<div className={(0, utils_1.cn)("my-6 w-full overflow-y-auto", className)}>
      <table className={(0, utils_1.cn)("w-full")}>
        <thead>
          <tr className={(0, utils_1.cn)("m-0 border-t p-0 even:bg-muted")}>
            <th className={(0, utils_1.cn)("border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right")}>
              King&apos;s Treasury
            </th>
            <th className={(0, utils_1.cn)("border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right")}>
              People&apos;s happiness
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className={(0, utils_1.cn)("m-0 border-t p-0 even:bg-muted")}>
            <td className={(0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right")}>
              Empty
            </td>
            <td className={(0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right")}>
              Overflowing
            </td>
          </tr>
          <tr className={(0, utils_1.cn)("m-0 border-t p-0 even:bg-muted")}>
            <td className={(0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right")}>
              Modest
            </td>
            <td className={(0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right")}>
              Satisfied
            </td>
          </tr>
          <tr className={(0, utils_1.cn)("m-0 border-t p-0 even:bg-muted")}>
            <td className={(0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right")}>
              Full
            </td>
            <td className={(0, utils_1.cn)("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right")}>
              Ecstatic
            </td>
          </tr>
        </tbody>
      </table>
    </div>);
}
function TypographyList({ children, className, }) {
    return (<ul className={(0, utils_1.cn)("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
      {children}
    </ul>);
}
function TypographyInlineCode({ children, className, }) {
    return (<code className={(0, utils_1.cn)("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}>
      {children}
    </code>);
}
function TypographyLead({ children, className, }) {
    return (<p className={(0, utils_1.cn)("text-xl text-muted-foreground", className)}>{children}</p>);
}
function TypographyLarge({ children, className, }) {
    return (<div className={(0, utils_1.cn)("text-lg font-semibold", className)}>{children}</div>);
}
function TypographySmall({ children, className, }) {
    return (<small className={(0, utils_1.cn)("text-sm font-medium leading-none", className)}>
      {children}
    </small>);
}
function TypographyMuted({ children, className, }) {
    return (<p className={(0, utils_1.cn)("text-sm text-muted-foreground", className)}>{children}</p>);
}
//# sourceMappingURL=typography.js.map