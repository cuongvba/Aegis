import React, { useState, useEffect } from 'react';
import { X, Settings, PlusCircle, Save } from 'lucide-react';
import type { TeamOrgUnitInfo } from '../hooks/useTeamManagement';

interface TeamSettingsModalProps {
  isOpen: boolean;
  mode: 'edit' | 'create';
  currentTeam: TeamOrgUnitInfo | null;
  onClose: () => void;
  onUpdateTeam: (payload: {
    name: string;
    code?: string;
    description?: string;
    email?: string;
    phoneNumber?: string;
  }) => Promise<void>;
  onCreateTeam: (payload: {
    name: string;
    code?: string;
    description?: string;
  }) => Promise<any>;
}

export const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  isOpen,
  mode,
  currentTeam,
  onClose,
  onUpdateTeam,
  onCreateTeam,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && currentTeam) {
      setName(currentTeam.name || '');
      setCode(currentTeam.code || '');
      setDescription(currentTeam.address || '');
    } else {
      setName('');
      setCode('');
      setDescription('');
    }
  }, [isOpen, mode, currentTeam]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (mode === 'edit') {
        await onUpdateTeam({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim(),
        });
      } else {
        await onCreateTeam({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể lưu thông tin Đội nhóm / Lớp học.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {mode === 'edit' ? <Settings size={18} /> : <PlusCircle size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === 'edit' ? 'Cập Nhật Thông Tin Lớp / Đội Nhóm' : 'Tạo Lớp Học / Đội Nhóm Mới'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Đồng bộ trực tiếp vào cây tổ chức PostgreSQL
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Tên Lớp Học / Đội Nhóm *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Lớp 12A1 — Chuyên Toán THPT Quốc Gia"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Mã Định Danh Lớp / Nhóm
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              placeholder="CLS_12A1_2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Mô Tả / Ghi Chú
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú lịch học hoặc mục tiêu khảo thí..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              <span>{submitting ? 'Đang lưu...' : mode === 'edit' ? 'Lưu Thay Đổi' : 'Khởi Tạo Nhóm'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

