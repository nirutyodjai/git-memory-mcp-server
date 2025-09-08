'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUserAuth } from '@/contexts/user-auth';
import { User, Settings, LogOut, Edit3, Mail, Calendar, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface UserProfileProps {
  onEditProfile?: () => void;
}

export default function UserProfile({ onEditProfile }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user, logout, updateProfile } = useUserAuth();

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowEditForm(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await updateProfile(editData);
      if (result.success) {
        setShowEditForm(false);
      } else {
        setError(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'user':
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'user':
      default:
        return 'สมาชิก';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name || user.username}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            @{user.username}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {!showEditForm ? (
            <>
              {/* User Info */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {user.name || user.username}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* User Stats */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Mail size={12} />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      เข้าร่วมเมื่อ {formatDistanceToNow(new Date(user.createdAt), { 
                        addSuffix: true, 
                        locale: th 
                      })}
                    </span>
                  </div>
                </div>
                
                {!user.emailVerified && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      อีเมลยังไม่ได้รับการยืนยัน
                    </p>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit3 size={16} />
                  แก้ไขโปรไฟล์
                </button>
                
                <button
                  onClick={() => {}}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  การตั้งค่า
                </button>
                
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  ออกจากระบบ
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Edit Profile Form */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">แก้ไขโปรไฟล์</h3>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ชื่อ
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="กรอกชื่อ"
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ประวัติส่วนตัว
                    </label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                      placeholder="เขียนเกี่ยวกับตัวคุณ"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {editData.bio.length}/500 ตัวอักษร
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setError('');
                      setEditData({
                        name: user.name || '',
                        bio: user.bio || ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}