import React from 'react';
import { ShieldCheck, AlertTriangle, Activity, Download } from 'lucide-react';
import type { IsmsOverviewResponse } from './ismsApi';

interface Props {
  data: IsmsOverviewResponse;
  onExport: () => void;
}

export const IsmsOverviewCards: React.FC<Props> = ({ data, onExport }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Tuân thủ ISO 27001:2022</span>
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="mt-2 text-2xl font-black text-emerald-400">{data.compliancePercent}%</div>
      <div className="mt-1 text-[11px] text-slate-400">Tự động thu thập bằng chứng từ {data.totpEnabledCount} khóa 2FA</div>
    </div>

    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Rủi ro Cao / Nghiêm trọng</span>
        <AlertTriangle className="w-4 h-4 text-amber-400" />
      </div>
      <div className="mt-2 text-2xl font-black text-amber-300">{data.highRiskCount}</div>
      <div className="mt-1 text-[11px] text-slate-400">Tự động kích hoạt RTP & đẩy /work-ledger</div>
    </div>

    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Sự cố & CAPA đang mở</span>
        <Activity className="w-4 h-4 text-rose-400" />
      </div>
      <div className="mt-2 text-2xl font-black text-rose-300">{data.openIncidentCount}</div>
      <div className="mt-1 text-[11px] text-slate-400">Ánh xạ tự động AI sang điều khoản A.5–A.8</div>
    </div>

    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
      <div className="text-xs text-slate-400">Hồ sơ Kiểm toán (SHA-256)</div>
      <button
        onClick={onExport}
        className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-black text-white"
      >
        <Download className="w-4 h-4" /> Xuất Bộ Hồ Sơ Audit
      </button>
    </div>
  </div>
);
