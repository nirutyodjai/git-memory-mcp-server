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
const react_1 = __importStar(require("react"));
const useApi_1 = require("@/hooks/useApi");
const DatabaseDashboard = () => {
    const [stats, setStats] = (0, react_1.useState)({ users: 0, posts: 0, comments: 0, analytics: 0 });
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const { data: healthData, loading: healthLoading, error: healthError } = (0, useApi_1.useHealthCheck)();
    const { data: usersData, loading: usersLoading, refetch: refetchUsers } = (0, useApi_1.useUsers)({ limit: 5 });
    const { data: postsData, loading: postsLoading, refetch: refetchPosts } = (0, useApi_1.usePosts)({ limit: 5 });
    const { data: commentsData, loading: commentsLoading, refetch: refetchComments } = (0, useApi_1.useComments)({ limit: 5 });
    const { data: analyticsData, loading: analyticsLoading } = (0, useApi_1.useAnalytics)();
    const { trackEvent } = (0, useApi_1.useTrackAnalytics)();
    (0, react_1.useEffect)(() => {
        // Track dashboard view
        trackEvent('system', {
            event: 'dashboard_view',
            category: 'admin',
            metadata: { tab: activeTab }
        });
    }, [activeTab, trackEvent]);
    (0, react_1.useEffect)(() => {
        // Update stats when data changes
        setStats({
            users: usersData?.pagination?.total || 0,
            posts: postsData?.pagination?.total || 0,
            comments: commentsData?.pagination?.total || 0,
            analytics: analyticsData?.summary?.total || 0
        });
    }, [usersData, postsData, commentsData, analyticsData]);
    const refreshAll = () => {
        refetchUsers();
        refetchPosts();
        refetchComments();
        trackEvent('system', {
            event: 'dashboard_refresh',
            category: 'admin'
        });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
            case 'ok':
                return 'text-green-600 bg-green-100';
            case 'unhealthy':
            case 'error':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-yellow-600 bg-yellow-100';
        }
    };
    const StatCard = ({ title, value, icon, color }) => (<div className={`p-6 rounded-lg shadow-md ${color} transition-transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>);
    const TabButton = ({ tab, label, isActive }) => (<button onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
      {label}
    </button>);
    return (<div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Dashboard</h1>
          <p className="text-gray-600 mt-2">จัดการและติดตามข้อมูลในระบบ</p>
        </div>
        <button onClick={refreshAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          🔄 รีเฟรช
        </button>
      </div>

      {/* Health Status */}
      {healthData && (<div className="mb-8 p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">สถานะระบบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
                {healthData.status.toUpperCase()}
              </span>
              <span className="text-gray-600">ระบบหลัก</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.services.database.status)}`}>
                {healthData.services.database.status.toUpperCase()}
              </span>
              <span className="text-gray-600">ฐานข้อมูล</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Uptime: {Math.floor(healthData.services.server.uptime / 3600)}h {Math.floor((healthData.services.server.uptime % 3600) / 60)}m</p>
            <p>Memory: {Math.round(healthData.services.server.memory.used / 1024 / 1024)}MB / {Math.round(healthData.services.server.memory.total / 1024 / 1024)}MB</p>
          </div>
        </div>)}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="ผู้ใช้งาน" value={stats.users} icon="👥" color="bg-blue-50"/>
        <StatCard title="โพสต์" value={stats.posts} icon="📝" color="bg-green-50"/>
        <StatCard title="ความคิดเห็น" value={stats.comments} icon="💬" color="bg-purple-50"/>
        <StatCard title="Analytics Events" value={stats.analytics} icon="📊" color="bg-orange-50"/>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton tab="overview" label="ภาพรวม" isActive={activeTab === 'overview'}/>
        <TabButton tab="users" label="ผู้ใช้งาน" isActive={activeTab === 'users'}/>
        <TabButton tab="posts" label="โพสต์" isActive={activeTab === 'posts'}/>
        <TabButton tab="comments" label="ความคิดเห็น" isActive={activeTab === 'comments'}/>
        <TabButton tab="analytics" label="Analytics" isActive={activeTab === 'analytics'}/>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'overview' && (<div>
            <h3 className="text-xl font-semibold mb-4">ภาพรวมระบบ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">ข้อมูลล่าสุด</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• ผู้ใช้งานทั้งหมด: {stats.users} คน</li>
                  <li>• โพสต์ที่เผยแพร่: {stats.posts} โพสต์</li>
                  <li>• ความคิดเห็น: {stats.comments} ความคิดเห็น</li>
                  <li>• Analytics Events: {stats.analytics} events</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">สถานะการเชื่อมต่อ</h4>
                <div className="space-y-2">
                  {healthLoading && <p className="text-gray-500">กำลังตรวจสอบ...</p>}
                  {healthError && <p className="text-red-500">เกิดข้อผิดพลาด: {healthError}</p>}
                  {healthData && (<div className="text-sm">
                      <p className={`font-medium ${healthData.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                        ระบบ: {healthData.status === 'ok' ? 'ปกติ' : 'มีปัญหา'}
                      </p>
                      <p className={`font-medium ${healthData.services.database.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                        ฐานข้อมูล: {healthData.services.database.status === 'healthy' ? 'เชื่อมต่อแล้ว' : 'ไม่สามารถเชื่อมต่อ'}
                      </p>
                    </div>)}
                </div>
              </div>
            </div>
          </div>)}

        {activeTab === 'users' && (<div>
            <h3 className="text-xl font-semibold mb-4">ผู้ใช้งานล่าสุด</h3>
            {usersLoading ? (<p className="text-gray-500">กำลังโหลด...</p>) : usersData && usersData.length > 0 ? (<div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">ชื่อผู้ใช้</th>
                      <th className="text-left py-2">อีเมล</th>
                      <th className="text-left py-2">บทบาท</th>
                      <th className="text-left py-2">วันที่สมัคร</th>
                      <th className="text-left py-2">โพสต์</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.map((user) => (<tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {user.avatar ? (<img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full"/>) : (<div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                {user.username[0].toUpperCase()}
                              </div>)}
                            <span className="font-medium">{user.username}</span>
                            {user.verified && <span className="text-blue-500">✓</span>}
                          </div>
                        </td>
                        <td className="py-2 text-gray-600">{user.email}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        user.role === 'MODERATOR' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2 text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('th-TH')}
                        </td>
                        <td className="py-2 text-gray-600">{user._count?.posts || 0}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>) : (<p className="text-gray-500">ไม่มีข้อมูลผู้ใช้งาน</p>)}
          </div>)}

        {activeTab === 'posts' && (<div>
            <h3 className="text-xl font-semibold mb-4">โพสต์ล่าสุด</h3>
            {postsLoading ? (<p className="text-gray-500">กำลังโหลด...</p>) : postsData && postsData.length > 0 ? (<div className="space-y-4">
                {postsData.map((post) => (<div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-lg">{post.title}</h4>
                      <div className="flex gap-2">
                        {post.published && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">เผยแพร่</span>}
                        {post.featured && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">แนะนำ</span>}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{post.excerpt || post.content.substring(0, 150) + '...'}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>โดย {post.author.name || post.author.username}</span>
                      <div className="flex gap-4">
                        <span>💬 {post._count.comments}</span>
                        <span>❤️ {post._count.likes}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                    {post.tags.length > 0 && (<div className="flex gap-1 mt-2">
                        {post.tags.map((tag, index) => (<span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            #{tag}
                          </span>))}
                      </div>)}
                  </div>))}
              </div>) : (<p className="text-gray-500">ไม่มีโพสต์</p>)}
          </div>)}

        {activeTab === 'comments' && (<div>
            <h3 className="text-xl font-semibold mb-4">ความคิดเห็นล่าสุด</h3>
            {commentsLoading ? (<p className="text-gray-500">กำลังโหลด...</p>) : commentsData && commentsData.length > 0 ? (<div className="space-y-4">
                {commentsData.map((comment) => (<div key={comment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {comment.author.avatar ? (<img src={comment.author.avatar} alt={comment.author.username} className="w-8 h-8 rounded-full"/>) : (<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
                            {comment.author.username[0].toUpperCase()}
                          </div>)}
                        <span className="font-medium">{comment.author.name || comment.author.username}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{comment.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>ใน: {comment.post.title}</span>
                      <div className="flex gap-4">
                        <span>❤️ {comment._count.likes}</span>
                        <span>💬 {comment._count.replies}</span>
                      </div>
                    </div>
                    {comment.parent && (<div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                        <span className="text-gray-600">ตอบกลับ: </span>
                        <span className="font-medium">{comment.parent.author.name || comment.parent.author.username}</span>
                        <p className="text-gray-600 mt-1">{comment.parent.content.substring(0, 100)}...</p>
                      </div>)}
                  </div>))}
              </div>) : (<p className="text-gray-500">ไม่มีความคิดเห็น</p>)}
          </div>)}

        {activeTab === 'analytics' && (<div>
            <h3 className="text-xl font-semibold mb-4">Analytics</h3>
            {analyticsLoading ? (<p className="text-gray-500">กำลังโหลด...</p>) : analyticsData?.summary ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-600">User Events</h4>
                  <p className="text-2xl font-bold text-blue-600">{analyticsData.summary.userEvents}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-600">Post Events</h4>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.summary.postEvents}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-600">System Events</h4>
                  <p className="text-2xl font-bold text-purple-600">{analyticsData.summary.systemEvents}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-600">Total Events</h4>
                  <p className="text-2xl font-bold text-orange-600">{analyticsData.summary.total}</p>
                </div>
              </div>) : (<p className="text-gray-500">ไม่มีข้อมูล Analytics</p>)}
          </div>)}
      </div>
    </div>);
};
exports.default = DatabaseDashboard;
//# sourceMappingURL=DatabaseDashboard.js.map