"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Newsletter = Newsletter;
exports.NewsletterPopup = NewsletterPopup;
exports.NewsletterBanner = NewsletterBanner;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function Newsletter({ title = "รับข่าวสารล่าสุด", description = "สมัครรับข่าวสารและบทความใหม่ๆ ส่งตรงถึงอีเมลของคุณ", placeholder = "กรอกอีเมลของคุณ", buttonText = "สมัครสมาชิก", className = "", variant = "default" }) {
    const [email, setEmail] = (0, react_1.useState)('');
    const [status, setStatus] = (0, react_1.useState)('idle');
    const [message, setMessage] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !isValidEmail(email)) {
            setStatus('error');
            setMessage('กรุณากรอกอีเมลที่ถูกต้อง');
            return;
        }
        setStatus('loading');
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (data.success) {
                setStatus('success');
                setMessage(data.message || 'สมัครสมาชิกสำเร็จแล้ว!');
                setEmail('');
            }
            else {
                setStatus('error');
                setMessage(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            }
        }
        catch (error) {
            setStatus('error');
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        }
    };
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    const getVariantClasses = () => {
        switch (variant) {
            case 'minimal':
                return 'bg-transparent border-0 p-0';
            case 'card':
                return 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700';
            case 'inline':
                return 'flex items-center gap-4';
            default:
                return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6';
        }
    };
    return (<div className={`newsletter ${getVariantClasses()} ${className}`}>
      {variant !== 'inline' && (<div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <lucide_react_1.Mail className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>)}

      <form onSubmit={handleSubmit} className={variant === 'inline' ? 'flex gap-2' : 'space-y-4'}>
        <div className={variant === 'inline' ? 'flex-1' : 'w-full'}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" disabled={status === 'loading' || status === 'success'} required/>
        </div>
        
        <button type="submit" disabled={status === 'loading' || status === 'success'} className={`${variant === 'inline' ? 'px-6 py-3' : 'w-full py-3'} bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2`}>
          {status === 'loading' && <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>}
          {status === 'success' && <lucide_react_1.CheckCircle className="w-4 h-4"/>}
          {status === 'loading' ? 'กำลังสมัคร...' : status === 'success' ? 'สำเร็จ!' : buttonText}
        </button>
      </form>

      {message && (<div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${status === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
          {status === 'success' ? (<lucide_react_1.CheckCircle className="w-4 h-4"/>) : (<lucide_react_1.AlertCircle className="w-4 h-4"/>)}
          <span className="text-sm">{message}</span>
        </div>)}

      {variant !== 'minimal' && (<div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          เราจะไม่แชร์อีเมลของคุณกับบุคคลที่สาม และคุณสามารถยกเลิกการสมัครได้ตลอดเวลา
        </div>)}
    </div>);
}
function NewsletterPopup({ isOpen, onClose, title = "อย่าพลาดข่าวสารดีๆ!", description = "สมัครรับข่าวสารและเทคนิคใหม่ๆ ส่งตรงถึงอีเมลของคุณ" }) {
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        
        <div className="p-6">
          <Newsletter title={title} description={description} variant="card" className="border-0 shadow-none p-0 bg-transparent"/>
        </div>
      </div>
    </div>);
}
// Newsletter Banner Component
function NewsletterBanner({ onDismiss }) {
    return (<div className="bg-blue-600 text-white py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <lucide_react_1.Mail className="w-5 h-5"/>
          <span className="text-sm font-medium">
            สมัครรับข่าวสารและเทคนิคใหม่ๆ ทุกสัปดาห์
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Newsletter variant="inline" placeholder="อีเมลของคุณ" buttonText="สมัคร" className="bg-transparent"/>
          
          {onDismiss && (<button onClick={onDismiss} className="text-white hover:text-gray-200 ml-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>)}
        </div>
      </div>
    </div>);
}
exports.default = Newsletter;
//# sourceMappingURL=newsletter.js.map