import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Layers, ChevronDown, LayoutDashboard, Shield, Users, Sparkles, Atom,
  FileText, Film, Music, FileCheck2, CalendarCheck2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WorkspaceLink {
  title: string;
  desc: string;
  path: string;
  icon: React.ReactNode;
  accent: string;
}

export function WorkspaceDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, canAccessAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  if (!user) return null;

  const go = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const eduLinks: WorkspaceLink[] = [
    { title: 'Học Tập & Khảo Thí', desc: 'Dashboard & tiến độ IRT/CAT', path: '/dashboard', icon: <LayoutDashboard size={14} />, accent: 'bg-cyan-500/15 text-cyan-300' },
    { title: 'Kids World 6-Lớp', desc: 'Sân khấu & game di sản trẻ em', path: '/kids', icon: <Sparkles size={14} />, accent: 'bg-rose-500/15 text-rose-300' },
    { title: 'Phòng Lab 60fps', desc: 'Bài giảng trực quan & xuất Video', path: '/visual-lab', icon: <Film size={14} />, accent: 'bg-sky-500/15 text-sky-300' },
    { title: 'Zen Studio (Soạn Đề)', desc: 'Bóc tách Word/MathType & QTI 3.0', path: '/creator/studio', icon: <Sparkles size={14} />, accent: 'bg-pink-500/15 text-pink-300' },
    { title: 'Nhạc V-OS Studio', desc: 'Tổng hợp âm thanh học liệu', path: '/music-studio', icon: <Music size={14} />, accent: 'bg-violet-500/15 text-violet-300' },
    { title: 'Đại Hội Thảo AI', desc: 'Phản biện 6 pha & AegisNotebook', path: '/symposium', icon: <Atom size={14} />, accent: 'bg-indigo-500/15 text-indigo-300' },
  ];

  const opsLinks: WorkspaceLink[] = [
    { title: 'Quản Lý Công Văn (7 Pha)', desc: 'OCR, AI Auto-Pilot & TOTP 2FA', path: '/dispatches', icon: <FileCheck2 size={14} />, accent: 'bg-amber-500/15 text-amber-300' },
    { title: 'Smart Work & Lịch Google', desc: 'Sổ KPI, Kanban, điểm danh & lịch', path: '/work-ledger', icon: <CalendarCheck2 size={14} />, accent: 'bg-violet-500/15 text-violet-300' },
    { title: 'Office Studio (OCR/PDF)', desc: 'Đọc/chuyển đổi Word, Excel, PDF', path: '/office-studio', icon: <FileText size={14} />, accent: 'bg-sky-500/15 text-sky-300' },
    { title: 'Phân Hệ Đội Nhóm', desc: 'Giao việc, thảo luận & tiến độ', path: '/team', icon: <Users size={14} />, accent: 'bg-emerald-500/15 text-emerald-300' },
    { title: 'ISMS ISO/IEC 27001:2022', desc: '93 Controls SoA, Rủi ro 5x5 & CAPA', path: '/isms', icon: <ShieldCheck size={14} />, accent: 'bg-emerald-500/20 text-emerald-300' },
  ];

  return (
    <div ref={containerRef} className="relative" role="navigation" aria-label={t('workspacesMenu.title', 'Không gian làm việc')}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 text-xs font-bold cursor-pointer select-none shadow-sm ${
          isOpen
            ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200 ring-2 ring-indigo-500/25'
            : 'border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 hover:text-white'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Layers size={14} className="text-indigo-400" />
        <span>{t('nav.workspaces', 'Không gian làm việc')}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full mt-2 w-[340px] sm:w-[560px] bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/80 p-3 z-50 ring-1 ring-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 border-b border-slate-800">
                Giáo dục & Sáng tạo
              </div>
              {eduLinks.map((item) => (
                <button key={item.path} type="button" onClick={() => go(item.path)} className="w-full text-start px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-800/80 transition group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.accent}`}>{item.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800">
                Văn phòng • Điều hành • ISO 27001
              </div>
              {opsLinks.map((item) => (
                <button key={item.path} type="button" onClick={() => go(item.path)} className="w-full text-start px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-800/80 transition group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.accent}`}>{item.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                </button>
              ))}
              {canAccessAdmin && (
                <button type="button" onClick={() => go('/admin')} className="w-full text-start px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 bg-purple-950/30 hover:bg-purple-950/60 border border-purple-500/25 transition">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-purple-500/20 text-purple-300"><Shield size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-purple-200 truncate">Quản Trị Hệ Thống</div>
                    <div className="text-[10px] text-purple-400 truncate">Tổ chức, nhân sự & ngân hàng</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
