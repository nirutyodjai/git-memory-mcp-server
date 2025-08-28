"use strict";
'use client';
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthModal;
const react_1 = __importStar(require("react"));
const user_auth_1 = require("@/contexts/user-auth");
const lucide_react_1 = require("lucide-react");
function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
    const [mode, setMode] = (0, react_1.useState)(initialMode);
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [loginData, setLoginData] = (0, react_1.useState)({
        identifier: '',
        password: ''
    });
    const [registerData, setRegisterData] = (0, react_1.useState)({
        email: '',
        username: '',
        password: '',
        name: '',
        bio: ''
    });
    const { login, register } = (0, user_auth_1.useUserAuth)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let result;
            if (mode === 'login') {
                result = await login(loginData.identifier, loginData.password);
            }
            else {
                result = await register(registerData);
            }
            if (result.success) {
                onClose();
                // Reset forms
                setLoginData({ identifier: '', password: '' });
                setRegisterData({ email: '', username: '', password: '', name: '', bio: '' });
            }
            else {
                setError(result.error || 'เกิดข้อผิดพลาด');
            }
        }
        catch (error) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
        finally {
            setLoading(false);
        }
    };
    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <lucide_react_1.X size={20}/>
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            {mode === 'login' ? (<lucide_react_1.LogIn className="text-blue-600 dark:text-blue-400" size={24}/>) : (<lucide_react_1.UserPlus className="text-green-600 dark:text-green-400" size={24}/>)}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === 'login'
            ? 'เข้าสู่ระบบเพื่อใช้งานฟีเจอร์ทั้งหมด'
            : 'สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {error && (<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>)}

          <div className="space-y-4">
            {mode === 'login' ? (<>
                {/* Login Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    อีเมลหรือชื่อผู้ใช้
                  </label>
                  <div className="relative">
                    <lucide_react_1.User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                    <input type="text" value={loginData.identifier} onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="กรอกอีเมลหรือชื่อผู้ใช้" required/>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <lucide_react_1.Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                    <input type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="กรอกรหัสผ่าน" required/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showPassword ? <lucide_react_1.EyeOff size={18}/> : <lucide_react_1.Eye size={18}/>}
                    </button>
                  </div>
                </div>
              </>) : (<>
                {/* Register Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    อีเมล *
                  </label>
                  <div className="relative">
                    <lucide_react_1.Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                    <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="กรอกอีเมล" required/>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ชื่อผู้ใช้ *
                  </label>
                  <div className="relative">
                    <lucide_react_1.User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                    <input type="text" value={registerData.username} onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="กรอกชื่อผู้ใช้" required/>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    รหัสผ่าน *
                  </label>
                  <div className="relative">
                    <lucide_react_1.Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                    <input type={showPassword ? 'text' : 'password'} value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="กรอกรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" required/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showPassword ? <lucide_react_1.EyeOff size={18}/> : <lucide_react_1.Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ชื่อจริง
                  </label>
                  <input type="text" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="กรอกชื่อจริง (ไม่บังคับ)"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ประวัติส่วนตัว
                  </label>
                  <textarea value={registerData.bio} onChange={(e) => setRegisterData({ ...registerData, bio: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" placeholder="เขียนเกี่ยวกับตัวคุณ (ไม่บังคับ)" rows={3} maxLength={500}/>
                </div>
              </>)}
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${mode === 'login'
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}>
            {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>

          {/* Switch Mode */}
          <div className="mt-4 text-center">
            <button type="button" onClick={switchMode} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              {mode === 'login'
            ? 'ยังไม่มีบัญชี? สมัครสมาชิก'
            : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
//# sourceMappingURL=AuthModal.js.map