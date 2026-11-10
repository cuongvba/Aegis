import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderPlus, Save, FolderTree, Sparkles } from 'lucide-react';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';
import { flattenTopicTreeForSelect } from '@/shared/lib/quiz/topicTreeHelper';
import type { QuickTopicPayload } from '../hooks/useZenSavedBank';

interface ZenQuickTopicModalProps {
  isOpen: boolean;
  editingTopic: BankTopic | null;
  defaultParentId: string | null;
  topics: BankTopic[];
  questions: LearnerQuestion[];
  onClose: () => void;
  onSubmit: (payload: QuickTopicPayload, editingId?: string) => Promise<void>;
}

function slugifyTopicCode(text: string, prefixCode?: string): string {
  const clean = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 24);
  if (!clean) return prefixCode ? `${prefixCode}_SUB` : 'CHU_DE_MOI';
  if (prefixCode && prefixCode !== 'STUDIO' && prefixCode !== 'COMMUNITY') {
    return `${prefixCode}_${clean}`.slice(0, 40);
  }
  return clean;
}

export const ZenQuickTopicModal: React.FC<ZenQuickTopicModalProps> = ({
  isOpen,
  editingTopic,
  defaultParentId,
  topics,
  questions,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [domainCode, setDomainCode] = useState('EDUCATION');
  const [submitting, setSubmitting] = useState(false);

  const treeOptions = useMemo(
    () =>
      flattenTopicTreeForSelect(
        topics.filter((t) => !editingTopic || t.id !== editingTopic.id),
        questions
      ),
    [topics, questions, editingTopic]
  );

  const parentTopic = useMemo(
    () => topics.find((t) => t.id === parentId),
    [topics, parentId]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (editingTopic) {
      setName(editingTopic.name);
      setCode(editingTopic.code);
      setCodeTouched(true);
      setParentId(editingTopic.parentId || '');
      setDescription(editingTopic.description || '');
      setDomainCode(editingTopic.domainCode || 'EDUCATION');
    } else {
      const pTopic = topics.find((t) => t.id === defaultParentId);
      setName('');
      setCode('');
      setCodeTouched(false);
      setParentId(defaultParentId || '');
      setDescription('');
      setDomainCode(pTopic?.domainCode || 'EDUCATION');
    }
  }, [isOpen, editingTopic, defaultParentId, topics]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingTopic && !codeTouched) {
      setCode(slugifyTopicCode(val, parentTopic?.code));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(
        {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim(),
          parentId: parentId || null,
          domainCode,
        },
        editingTopic?.id
      );
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể lưu chủ đề. Vui lòng kiểm tra mã chủ đề.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderPlus size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {editingTopic
                  ? 'Cập Nhật Nhánh Chủ Đề'
                  : parentTopic
                  ? `Tạo Chủ Đề Con Trong "${parentTopic.name}"`
                  : 'Tạo Chủ Đề Gốc Mới'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Tổ chức cây thư mục phân cấp Đa tầng (Môn &rarr; Chương &rarr; Bài / Đề)
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
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
              <FolderTree size={12} className="text-amber-400" />
              <span>Thuộc Nhánh Cha (Cây Phân Cấp)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => {
                const newPid = e.target.value;
                setParentId(newPid);
                if (!editingTopic && !codeTouched && name) {
                  const p = topics.find((t) => t.id === newPid);
                  setCode(slugifyTopicCode(name, p?.code));
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">📁 (Thư mục Gốc — Cấp 1)</option>
              {treeOptions.map((opt) => (
                <option key={opt.topic.id} value={opt.topic.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Tên Chủ Đề / Thư Mục *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ví dụ: Toán 12 — Chương 1: Ứng dụng đạo hàm..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Sparkles size={11} className="text-cyan-400" />
                <span>Mã Định Danh *</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => {
                  setCodeTouched(true);
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                }}
                placeholder="TOAN12_CHUONG1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Lĩnh Vực
              </label>
              <select
                value={domainCode}
                onChange={(e) => setDomainCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="EDUCATION">🎓 Giáo dục</option>
                <option value="BANKING">🏦 Ngân hàng</option>
                <option value="GOV_DRIVING">🚗 Giao thông</option>
                <option value="IT_SECURITY">🛡️ CNTT</option>
                <option value="GENERAL">🌐 Tổng hợp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Ghi chú / Mô tả (Tùy chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về chuyên đề hoặc bộ đề..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              <span>{submitting ? 'Đang lưu...' : editingTopic ? 'Lưu Thay Đổi' : 'Tạo Nhánh Chủ Đề'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

