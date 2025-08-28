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
    return (<form className="min-w-7xl mx-auto sm:mt-4" onSubmit={handleSubmit}>
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
        <LabelInputContainer>
          <label_1.Label htmlFor="fullname">ชื่อ-นามสกุล</label_1.Label>
          <ace_input_1.Input id="fullname" placeholder="ชื่อของคุณ" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}/>
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <label_1.Label htmlFor="email">อีเมล</label_1.Label>
          <ace_input_1.Input id="email" placeholder="email@example.com" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
        </LabelInputContainer>
      </div>
      <div className="grid w-full gap-1.5 mb-4">
        <label_1.Label htmlFor="content">ข้อความของคุณ</label_1.Label>
        <ace_textarea_1.Textarea placeholder="บอกเราเกี่ยวกับโครงการของคุณ" id="content" required value={message} onChange={(e) => setMessage(e.target.value)}/>
        <p className="text-sm text-muted-foreground">
          เราจะไม่เปิดเผยข้อมูลของคุณให้กับบุคคลอื่น สัญญา!
        </p>
      </div>
      <button_1.Button disabled={loading} className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]" type="submit">
        {loading ? (<div className="flex items-center justify-center">
            <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            <p>กรุณารอสักครู่</p>
          </div>) : (<div className="flex items-center justify-center">
            ส่งข้อความ <lucide_react_1.ChevronRight className="w-4 h-4 ml-4"/>
          </div>)}
        <BottomGradient />
      </button_1.Button>
    </form>);
};
exports.default = ContactForm;
const LabelInputContainer = ({ children, className, }) => {
    return (<div className={(0, utils_1.cn)("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>);
};
const BottomGradient = () => {
    return (<>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-brand to-transparent"/>
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent orange-400 to-transparent"/>
    </>);
};
//# sourceMappingURL=ContactForm.js.map