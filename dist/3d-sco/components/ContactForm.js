"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lucide_react_1 = require("lucide-react");
const react_1 = __importDefault(require("react"));
const label_1 = require("./ui/label");
const ace_input_1 = require("./ui/ace-input");
const ace_textarea_1 = require("./ui/ace-textarea");
const utils_1 = require("@/lib/utils");
const use_toast_1 = require("./ui/use-toast");
const button_1 = require("./ui/button");
const navigation_1 = require("next/navigation");
const ContactForm = () => {
    const [fullName, setFullName] = react_1.default.useState("");
    const [email, setEmail] = react_1.default.useState("");
    const [message, setMessage] = react_1.default.useState("");
    const [loading, setLoading] = react_1.default.useState(false);
    const { toast } = (0, use_toast_1.useToast)();
    const router = (0, navigation_1.useRouter)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    message,
                }),
            });
            const data = await res.json();
            if (data.error)
                throw new Error(data.error);
            toast({
                title: "ขอบคุณครับ!",
                description: "เราจะติดต่อกลับโดยเร็วที่สุด",
                variant: "default",
                className: (0, utils_1.cn)("top-0 mx-auto flex fixed md:top-4 md:right-4"),
            });
            setLoading(false);
            setFullName("");
            setEmail("");
            setMessage("");
            const timer = setTimeout(() => {
                router.push("/");
                clearTimeout(timer);
            }, 1000);
        }
        catch (err) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "มีบางอย่างผิดพลาด! กรุณาตรวจสอบข้อมูลในฟอร์ม",
                className: (0, utils_1.cn)("top-0 w-full flex justify-center fixed md:max-w-7xl md:top-4 md:right-4"),
                variant: "destructive",
            });
        }
        setLoading(false);
    };
    return (react_1.default.createElement("form", { className: "min-w-7xl mx-auto sm:mt-4", onSubmit: handleSubmit },
        react_1.default.createElement("div", { className: "flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4" },
            react_1.default.createElement(LabelInputContainer, null,
                react_1.default.createElement(label_1.Label, { htmlFor: "fullname" }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25"),
                react_1.default.createElement(ace_input_1.Input, { id: "fullname", placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13", type: "text", required: true, value: fullName, onChange: (e) => setFullName(e.target.value) })),
            react_1.default.createElement(LabelInputContainer, { className: "mb-4" },
                react_1.default.createElement(label_1.Label, { htmlFor: "email" }, "\u0E2D\u0E35\u0E40\u0E21\u0E25"),
                react_1.default.createElement(ace_input_1.Input, { id: "email", placeholder: "email@example.com", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value) }))),
        react_1.default.createElement("div", { className: "grid w-full gap-1.5 mb-4" },
            react_1.default.createElement(label_1.Label, { htmlFor: "content" }, "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13"),
            react_1.default.createElement(ace_textarea_1.Textarea, { placeholder: "\u0E1A\u0E2D\u0E01\u0E40\u0E23\u0E32\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13", id: "content", required: true, value: message, onChange: (e) => setMessage(e.target.value) }),
            react_1.default.createElement("p", { className: "text-sm text-muted-foreground" }, "\u0E40\u0E23\u0E32\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E43\u0E2B\u0E49\u0E01\u0E31\u0E1A\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E2D\u0E37\u0E48\u0E19 \u0E2A\u0E31\u0E0D\u0E0D\u0E32!")),
        react_1.default.createElement(button_1.Button, { disabled: loading, className: "bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]", type: "submit" },
            loading ? (react_1.default.createElement("div", { className: "flex items-center justify-center" },
                react_1.default.createElement(lucide_react_1.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                react_1.default.createElement("p", null, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D\u0E2A\u0E31\u0E01\u0E04\u0E23\u0E39\u0E48"))) : (react_1.default.createElement("div", { className: "flex items-center justify-center" },
                "\u0E2A\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 ",
                react_1.default.createElement(lucide_react_1.ChevronRight, { className: "w-4 h-4 ml-4" }))),
            react_1.default.createElement(BottomGradient, null))));
};
exports.default = ContactForm;
const LabelInputContainer = ({ children, className, }) => {
    return (react_1.default.createElement("div", { className: (0, utils_1.cn)("flex flex-col space-y-2 w-full", className) }, children));
};
const BottomGradient = () => {
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("span", { className: "group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-brand to-transparent" }),
        react_1.default.createElement("span", { className: "group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent orange-400 to-transparent" })));
};
