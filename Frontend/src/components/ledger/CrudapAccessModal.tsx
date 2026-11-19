import React, { useState } from 'react';
import { Lock, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import type { ResourceAccessPolicy } from './smartLedgerRegistry';

interface Props {
  open: boolean;
  resourceId: string;
  policy?: ResourceAccessPolicy;
  onSave: (next: ResourceAccessPolicy) => void;
  onClose: () => void;
}

const DEFAULT_POLICY = (id: string): ResourceAccessPolicy => ({
  resourceType: 'SMART_LEDGER',
  resourceId: id,
  ownerUserId: 'current-owner',
  orgUnitId: '',
  visibility: 3, // Tenant
  memberPermissions: { 'role:MANAGER': 'CRUDAP', 'role:MEMBER': 'RU' },
  lockedFields: ['rating'],
  isApprovedLocked: false,
});

export const CrudapAccessModal: React.FC<Props> = ({ open, resourceId, policy, onSave, onClose }) => {
  const [draft, setDraft] = useState<ResourceAccessPolicy>(() => policy || DEFAULT_POLICY(resourceId));
  const [principalKey, setPrincipalKey] = useState('user:');
  const [flags, setFlags] = useState('RU');

  if (!open) return null;

  const toggleFlag = (ch: string) =>
    setFlags((prev) => (prev.includes(ch) ? prev.replace(ch, '') : prev + ch));

  const addEntry = () => {
    if (!principalKey.trim()) return;
    setDraft((p) => ({
      ...p,
      memberPermissions: { ...p.memberPermissions, [principalKey.trim()]: flags || 'R' },
    }));
    setPrincipalKey('user:');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/75">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black">Phân Quyền ATTT — Ma Trận CRUDAP</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-400 block mb-1">Phạm vi tiếp cận (Visibility)</label>
              <select
                value={draft.visibility}
                onChange={(e) => setDraft({ ...draft, visibility: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-bold"
              >
                <option value={0}>Riêng tư (Private)</option>
                <option value={1}>Chỉ người được gán quyền</option>
                <option value={2}>Theo Phòng ban / Lớp (OrgUnit)</option>
                <option value={3}>Toàn Cơ quan / Trường (Tenant)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-400 block mb-1">Mã Phòng ban / Lớp (OrgUnit)</label>
              <input
                value={draft.orgUnitId || ''}
                onChange={(e) => setDraft({ ...draft, orgUnitId: e.target.value })}
                placeholder="VD: PHONG_HANH_CHINH"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3 space-y-2">
            <div className="font-bold text-slate-300">Gán quyền C-R-U-D-A-P theo Vai trò / Cá nhân</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input value={principalKey} onChange={(e) => setPrincipalKey(e.target.value)} placeholder="user:id | role:MANAGER | email:..." className="flex-1 min-w-[160px] rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white" />
              <div className="flex gap-1">
                {['C', 'R', 'U', 'D', 'A', 'P'].map((ch) => (
                  <button key={ch} type="button" onClick={() => toggleFlag(ch)} className={`w-7 h-7 rounded-lg font-black ${flags.includes(ch) ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{ch}</button>
                ))}
              </div>
              <button type="button" onClick={addEntry} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 text-white font-bold"><Plus className="w-3.5 h-3.5" /> Gán</button>
            </div>
            <div className="space-y-1 pt-1">
              {Object.entries(draft.memberPermissions).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-1.5">
                  <span className="font-bold text-sky-300">{k}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black">{v}</span>
                    <button onClick={() => { const next = { ...draft.memberPermissions }; delete next[k]; setDraft({ ...draft, memberPermissions: next }); }} className="text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 cursor-pointer">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <div className="font-black text-amber-300">Phê duyệt & Chốt Sổ Bất Biến (Approve Lock)</div>
                <div className="text-[11px] text-slate-400">Khóa chỉnh sửa & xóa sau khi Lãnh đạo/Giáo viên duyệt.</div>
              </div>
            </div>
            <input type="checkbox" checked={draft.isApprovedLocked} onChange={(e) => setDraft({ ...draft, isApprovedLocked: e.target.checked })} className="accent-amber-500 w-4 h-4" />
          </label>
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/75 flex justify-end gap-2 text-xs">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Hủy</button>
          <button onClick={() => { onSave(draft); onClose(); }} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black">Lưu Chính Sách CRUDAP</button>
        </div>
      </div>
    </div>
  );
};
