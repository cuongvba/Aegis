import React, { useState } from 'react';
import { FileText, Lock, ShieldCheck, Stamp, Trash2, X } from 'lucide-react';
import type { OfficeDocumentProperties } from '@/services/officeWorkspace.service';

export interface DocumentSecurityState {
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkStyle: 'DIAGONAL' | 'STAMP_CORNER';
  password: string;
  properties: OfficeDocumentProperties;
}

interface Props {
  open: boolean;
  state: DocumentSecurityState;
  onChange: (next: DocumentSecurityState) => void;
  onClose: () => void;
}

export const DocumentInspectorDrawer: React.FC<Props> = ({ open, state, onChange, onClose }) => {
  const [tab, setTab] = useState<'STAMP' | 'SECURITY' | 'PROPS'>('STAMP');
  if (!open) return null;

  const updateProp = (key: keyof OfficeDocumentProperties, val: string) =>
    onChange({ ...state, properties: { ...state.properties, [key]: val } });

  return (
    <aside className="w-full lg:w-80 shrink-0 rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md flex flex-col overflow-hidden shadow-xl print:hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <span className="text-xs font-black tracking-wide text-slate-200 uppercase">Thuộc Tính & Bảo Mật</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-800 text-[11px] font-bold">
        <button
          onClick={() => setTab('STAMP')}
          className={`py-2.5 flex items-center justify-center gap-1 transition ${tab === 'STAMP' ? 'text-amber-300 border-b-2 border-amber-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Stamp className="w-3.5 h-3.5" /> Stamp
        </button>
        <button
          onClick={() => setTab('SECURITY')}
          className={`py-2.5 flex items-center justify-center gap-1 transition ${tab === 'SECURITY' ? 'text-emerald-300 border-b-2 border-emerald-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Lock className="w-3.5 h-3.5" /> Mật khẩu
        </button>
        <button
          onClick={() => setTab('PROPS')}
          className={`py-2.5 flex items-center justify-center gap-1 transition ${tab === 'PROPS' ? 'text-sky-300 border-b-2 border-sky-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-3.5 h-3.5" /> Properties
        </button>
      </div>

      <div className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
        {tab === 'STAMP' && (
          <>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <span className="font-bold text-slate-200">Bật Stamp / Watermark</span>
              <input
                type="checkbox"
                checked={state.watermarkEnabled}
                onChange={(e) => onChange({ ...state, watermarkEnabled: e.target.checked })}
                className="accent-amber-500 w-4 h-4"
              />
            </label>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Nội dung con dấu / chữ chìm</label>
              <input
                value={state.watermarkText}
                onChange={(e) => onChange({ ...state, watermarkText: e.target.value })}
                placeholder="VD: BẢN QUYỀN AEGIS — LƯU HÀNH NỘI BỘ"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Kiểu hiển thị trên trang</label>
              <select
                value={state.watermarkStyle}
                onChange={(e) => onChange({ ...state, watermarkStyle: e.target.value as 'DIAGONAL' | 'STAMP_CORNER' })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
              >
                <option value="DIAGONAL">Watermark chữ chìm chéo giữa trang</option>
                <option value="STAMP_CORNER">Con dấu Stamper đóng khung góc trên</option>
              </select>
            </div>
            {state.watermarkEnabled && (
              <button
                onClick={() => onChange({ ...state, watermarkEnabled: false, watermarkText: '' })}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Bỏ chèn Stamp & Watermark
              </button>
            )}
          </>
        )}

        {tab === 'SECURITY' && (
          <>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-[11px] text-emerald-200 flex gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>Mật khẩu áp dụng khóa chỉ đọc SHA-256 cho Word (.docx) hoặc mã hóa AES-256 khi nén .7z lúc lưu.</span>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Mật khẩu bảo vệ tài liệu</label>
              <input
                type="password"
                value={state.password}
                onChange={(e) => onChange({ ...state, password: e.target.value })}
                placeholder="Nhập mật khẩu (để trống = không khóa)"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            {state.password && (
              <button
                onClick={() => onChange({ ...state, password: '' })}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Gỡ bỏ mật khẩu
              </button>
            )}
          </>
        )}

        {tab === 'PROPS' && (
          <div className="space-y-2.5">
            <input value={state.properties.author || ''} onChange={(e) => updateProp('author', e.target.value)} placeholder="Tác giả (Author)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            <input value={state.properties.company || ''} onChange={(e) => updateProp('company', e.target.value)} placeholder="Đơn vị / Trường / Tổ chức (Company)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            <input value={state.properties.subject || ''} onChange={(e) => updateProp('subject', e.target.value)} placeholder="Chủ đề / Môn học (Subject)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            <input value={state.properties.keywords || ''} onChange={(e) => updateProp('keywords', e.target.value)} placeholder="Từ khóa (Keywords, cách nhau dấu phẩy)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            <select value={state.properties.classification || ''} onChange={(e) => updateProp('classification', e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white">
              <option value="">Mức phân loại: Mặc định</option>
              <option value="Công khai (Public)">Công khai (Public)</option>
              <option value="Lưu hành nội bộ (Internal)">Lưu hành nội bộ (Internal)</option>
              <option value="Mật / Bản quyền (Confidential)">Mật / Bản quyền (Confidential)</option>
            </select>
            <textarea rows={2} value={state.properties.description || ''} onChange={(e) => updateProp('description', e.target.value)} placeholder="Mô tả / Ghi chú hồ sơ (Comments)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white resize-none" />
          </div>
        )}
      </div>
    </aside>
  );
};
