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
exports.AdminAuthProvider = AdminAuthProvider;
exports.useAdminAuth = useAdminAuth;
const react_1 = __importStar(require("react"));
const AdminAuthContext = (0, react_1.createContext)(undefined);
function AdminAuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/admin/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            }
            else {
                setUser(null);
            }
        }
        catch (error) {
            setUser(null);
        }
        finally {
            setLoading(false);
        }
    };
    const login = async (username, password) => {
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                return { success: true };
            }
            else {
                return { success: false, error: data.error };
            }
        }
        catch (error) {
            return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
        }
    };
    const logout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            setUser(null);
        }
        catch (error) {
            console.error('Logout error:', error);
        }
    };
    (0, react_1.useEffect)(() => {
        checkAuth();
    }, []);
    return (<AdminAuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AdminAuthContext.Provider>);
}
function useAdminAuth() {
    const context = (0, react_1.useContext)(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
}
//# sourceMappingURL=admin-auth.js.map