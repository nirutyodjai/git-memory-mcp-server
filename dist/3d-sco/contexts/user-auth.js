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
exports.UserAuthProvider = UserAuthProvider;
exports.useUserAuth = useUserAuth;
const react_1 = __importStar(require("react"));
const UserAuthContext = (0, react_1.createContext)(undefined);
function UserAuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const login = async (identifier, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setUser(data.user);
                return { success: true };
            }
            else {
                return { success: false, error: data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
            }
        }
        catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
        }
    };
    const register = async (data) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setUser(result.user);
                return { success: true };
            }
            else {
                return { success: false, error: result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
            }
        }
        catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
        }
    };
    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            setUser(null);
        }
    };
    const updateProfile = async (data) => {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setUser(result.user);
                return { success: true };
            }
            else {
                return { success: false, error: result.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' };
            }
        }
        catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
        }
    };
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            if (response.ok && data.success) {
                setUser(data.user);
            }
            else {
                setUser(null);
            }
        }
        catch (error) {
            console.error('Check auth error:', error);
            setUser(null);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        checkAuth();
    }, []);
    return (<UserAuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            updateProfile,
            checkAuth,
        }}>
      {children}
    </UserAuthContext.Provider>);
}
function useUserAuth() {
    const context = (0, react_1.useContext)(UserAuthContext);
    if (context === undefined) {
        throw new Error('useUserAuth must be used within a UserAuthProvider');
    }
    return context;
}
//# sourceMappingURL=user-auth.js.map