import React from 'react';
import { ShieldCheck, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { AppRole } from '@/types/auth';
import { RuleStudioTab } from '@/pages/admin/questions/components/RuleStudioTab';

export function AdminParsingRulesPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Chỉ SystemAdmin hoặc TenantAdmin mới được phép xem/chỉnh sửa quy tắc bóc tách
  const isAuthorized = user?.role === AppRole.SystemAdmin || user?.role === AppRole.TenantAdmin;

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto font-sans">
        <div className="bg-red-950/30 border border-red-500/40 rounded-3xl p-8 backdrop-blur-xl text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-white">Truy Cập Bị Từ Chối (Admin Sovereignty Guard)</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Phân hệ Quản Trị Quy Tắc Bóc Tách CIG (Parsing Rules) là hạ tầng nhận thức cốt lõi của Aegis Global. Chỉ Quản Trị Viên Khách Thuê (TenantAdmin) và Quản Trị Tối Cao (SystemAdmin) mới được phép cấu hình.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> Quay lại Ngân Hàng Câu Hỏi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Security Sovereignty Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-500/30 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2.5 text-purple-300">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span className="font-bold">Khu Vực Quản Trị Cốt Lõi:</span>
          <span className="text-slate-300">
            Biên tập & Kiểm soát Máy Trạng Thái CIG 4 Chiều (PISA v7.0) — Đã được phân lập an toàn khỏi luồng người dùng thông thường.
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/questions')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          <ArrowLeft size={12} /> Quay lại Ngân Hàng Câu Hỏi
        </button>
      </div>

      {/* Standalone Rule Studio Tab */}
      <RuleStudioTab />
    </div>
  );
}

