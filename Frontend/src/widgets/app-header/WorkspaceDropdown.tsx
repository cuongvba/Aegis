import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Layers, ChevronDown, LayoutDashboard, 
  Shield, Users, Sparkles, Atom 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function WorkspaceDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, canAccessAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative" role="navigation" aria-label={t('workspacesMenu.title', 'Không gian làm việc')}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-200
                   text-xs font-bold cursor-pointer select-none shadow-sm
                   ${isOpen 
                     ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300 ring-2 ring-indigo-500/20' 
                     : 'border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white hover:border-slate-600'
                   }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Layers size={14} className="text-indigo-400" />
        <span>{t('nav.workspaces', 'Không gian làm việc')}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} 
          aria-hidden="true" 
        />
      </button>

      {isOpen && (
        <div
          className="absolute end-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl
                     rounded-2xl shadow-2xl border border-slate-700/80 p-2
                     z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right
                     ring-1 ring-white/10 space-y-1"
        >
          <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 mb-1">
            <Layers size={11} className="text-indigo-400" />
            <span>{t('workspacesMenu.title', 'Phân hệ Không gian làm việc')}</span>
          </div>

          {/* 1. Khu vực Học tập & Khảo thí */}
          <button
            type="button"
            onClick={() => handleNavigate('/dashboard')}
            className="w-full text-start px-3 py-2 text-xs rounded-xl font-bold transition-all
                       flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white group"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <LayoutDashboard size={14} />
            </div>
            <div>
              <div className="text-white font-bold">{t('workspacesMenu.learning', 'Không Gian Học Tập & Khảo Thí')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('workspacesMenu.learningDesc', 'Bảng điều khiển & tiến độ khảo thí cá nhân')}</div>
            </div>
          </button>

          {/* 2. Creator Zen Studio */}
          <button
            type="button"
            onClick={() => handleNavigate('/creator/studio')}
            className="w-full text-start px-3 py-2 text-xs rounded-xl font-bold transition-all
                       flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white group"
          >
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="text-white font-bold">{t('workspacesMenu.creator', 'Xưởng Sáng Tạo Zen Studio')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('workspacesMenu.creatorDesc', 'Soạn đề 3-chạm, chủ đề & ngân hàng câu hỏi')}</div>
            </div>
          </button>

          {/* 3. Không Gian Đội Nhóm */}
          <button
            type="button"
            onClick={() => handleNavigate('/team')}
            className="w-full text-start px-3 py-2 text-xs rounded-xl font-bold transition-all
                       flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Users size={14} />
            </div>
            <div>
              <div className="text-white font-bold">{t('workspacesMenu.team', 'Phân Hệ Đội Nhóm')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('workspacesMenu.teamDesc', 'Tiến độ học viên, thảo luận & giao bài thi')}</div>
            </div>
          </button>

          {/* 4. Viện Hàn Lâm & Đại Hội Thảo AI */}
          <button
            type="button"
            onClick={() => handleNavigate('/symposium')}
            className="w-full text-start px-3 py-2 text-xs rounded-xl font-bold transition-all
                       flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white group"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Atom size={14} />
            </div>
            <div>
              <div className="text-white font-bold">{t('workspacesMenu.symposium', 'Viện Hàn Lâm & Hội Thảo AI')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('workspacesMenu.symposiumDesc', 'Đại hội thảo 6 pha, đối chiếu tài liệu & AegisNotebook')}</div>
            </div>
          </button>

          {/* 5. Khu Quản trị Hệ thống */}
          {canAccessAdmin && (
            <button
              type="button"
              onClick={() => handleNavigate('/admin')}
              className="w-full text-start px-3 py-2 text-xs rounded-xl font-bold transition-all
                         flex items-center gap-2.5 text-slate-200 hover:bg-purple-950/40 hover:text-purple-200 group border border-purple-500/20 bg-purple-950/20 mt-1"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Shield size={14} />
              </div>
              <div>
                <div className="text-purple-300 font-bold">{t('workspacesMenu.admin', 'Trung Tâm Quản Trị Hệ Thống')}</div>
                <div className="text-[10px] text-purple-400/80 font-normal">{t('workspacesMenu.adminDesc', 'Quản lý tổ chức, ngân hàng câu hỏi & nhân sự')}</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
