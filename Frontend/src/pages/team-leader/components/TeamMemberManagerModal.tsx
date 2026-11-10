import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Save, Check, Mail, Phone, User, KeyRound } from 'lucide-react';
import type { TeamMemberRecord, AvailableUserOption } from '../hooks/useTeamManagement';

interface TeamMemberManagerModalProps {
  isOpen: boolean;
  editingMember: TeamMemberRecord | null;
  teamName: string;
  onClose: () => void;
  onSearchAvailable: (search: string) => Promise<AvailableUserOption[]>;
  onAddMember: (payload: {
    userId?: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    password?: string;
  }) => Promise<any>;
  onUpdateMember: (
    memberId: string,
    payload: { fullName?: string; email?: string; phoneNumber?: string }
  ) => Promise<any>;
}

export const TeamMemberManagerModal: React.FC<TeamMemberManagerModalProps> = ({
  isOpen,
  editingMember,
  teamName,
  onClose,
  onSearchAvailable,
  onAddMember,
  onUpdateMember,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'directory'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('Aegis@123');
  const [submitting, setSubmitting] = useState(false);

  // Directory search state
  const [dirSearch, setDirSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AvailableUserOption[]>([]);
  const [loadingDir, setLoadingDir] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingMember) {
      setActiveTab('form');
      setFullName(editingMember.fullName || '');
      setEmail(editingMember.email || '');
      setPhoneNumber(editingMember.phoneNumber || '');
    } else {
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('Aegis@123');
    }
  }, [isOpen, editingMember]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'directory') return;
    let cancelled = false;
    setLoadingDir(true);
    onSearchAvailable(dirSearch)
      .then((res) => {
        if (!cancelled) setAvailableUsers(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDir(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, dirSearch]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      if (editingMember) {
        await onUpdateMember(editingMember.userId, {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
        });
      } else {
        await onAddMember({
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          password: password.trim() || 'Aegis@123',
        });
      }
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi lưu thông tin học viên.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddExisting = async (u: AvailableUserOption) => {
    setAddingUserId(u.userId);
    try {
      await onAddMember({ userId: u.userId, email: u.email, fullName: u.fullName });
      setAvailableUsers((prev) => prev.filter((item) => item.userId !== u.userId));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể kết nạp học viên.');
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {editingMember ? 'Cập Nhật Hồ Sơ Thành Viên' : 'Quản Lý & Kết Nạp Thành Viên'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{teamName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Switcher Tabs (only when adding) */}
        {!editingMember && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              + Thêm / Tạo Học Viên Mới
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chọn Tài Khoản Có Sẵn
            </button>
          </div>
        )}

        {activeTab === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <User size={12} className="text-emerald-400" />
                <span>Họ và tên Học viên / Thành viên *</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Minh Khôi"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Mail size={12} className="text-sky-400" />
                <span>Email Đăng Nhập *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hocvien@truong.edu.vn"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Phone size={12} className="text-amber-400" />
                  <span>Số Điện Thoại</span>
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {!editingMember && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                    <KeyRound size={12} className="text-purple-400" />
                    <span>Mật Khẩu Khởi Tạo</span>
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Aegis@123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} />
                <span>
                  {submitting
                    ? 'Đang lưu...'
                    : editingMember
                    ? 'Lưu Thay Đổi'
                    : 'Kết Nạp Vào Nhóm'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email người dùng trong hệ thống..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {loadingDir ? (
                <p className="text-center py-8 text-xs text-slate-500">Đang tìm kiếm tài khoản...</p>
              ) : availableUsers.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">
                  Không còn tài khoản nào ngoài nhóm khớp từ khóa. Hãy chuyển sang tab &ldquo;+ Thêm / Tạo Học Viên Mới&rdquo;.
                </p>
              ) : (
                availableUsers.map((u) => (
                  <div
                    key={u.userId}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{u.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-400 truncate">{u.email}</p>
                    </div>
                    <button
                      type="button"
                      disabled={addingUserId === u.userId}
                      onClick={() => handleQuickAddExisting(u)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={13} />
                      <span>{addingUserId === u.userId ? 'Đang thêm...' : 'Thêm vào nhóm'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

