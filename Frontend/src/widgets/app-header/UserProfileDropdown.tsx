/**
 * Aegis — UserProfileDropdown Widget
 * ========================================
 * Menu Cá Nhân & Cá Nhân Hóa (Profile, Identity & Personalization Hub)
 * Thiết kế chuẩn mực: Tôn trọng ranh giới giữa Danh tính cá nhân và Không gian tác nghiệp.
 * FSD Layer: widgets/app-header/
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, ShieldCheck, Key, Sparkles, Volume2, VolumeX, 
  Target, Coffee, LogOut, Lock, Award, Smartphone
} from 'lucide-react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { BuyMeCoffeeModal } from '@/features/coffee/BuyMeCoffeeModal';
import { MobileAppInstallModal } from '@/components/common/MobileAppInstallModal';

export function UserProfileDropdown() {
  const { user, logout } = useAuthContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isCoffeeOpen, setIsCoffeeOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Trạng thái âm thanh cá nhân hóa (Buzzer & Sound effects)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aegis-sound-enabled') !== 'false';
  });

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('aegis-sound-enabled', String(next));
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 text-xs font-bold text-slate-300
                     hover:bg-slate-800 hover:text-white
                     rounded-full transition-all cursor-pointer"
        >
          {t('auth.login', 'Đăng nhập')}
        </button>
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2 text-xs font-bold
                     bg-[var(--brand-gradient)] text-white
                     rounded-full transition-all
                     shadow-[var(--tenant-shadow-primary)]
                     active:scale-95 cursor-pointer hover:brightness-110"
        >
          {t('auth.register', 'Đăng ký')}
        </button>
      </div>
    );
  }

  const initials = user.name?.[0]?.toUpperCase() ?? '?';

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('userMenu.accountLabel', { name: user.name ?? 'User' })}
        className="flex items-center gap-2
                   bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white
                   p-1 pe-3 rounded-full border border-slate-700/80 hover:border-slate-600
                   transition-all font-bold text-sm cursor-pointer shadow-sm select-none"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center
                     text-white shadow-inner uppercase text-xs font-black ring-2 ring-cyan-500/30"
          style={{ background: 'var(--brand-gradient-vip)' }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <span className="hidden sm:inline-block text-slate-200 truncate max-w-[110px]">
          {user.name ?? 'User'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label={t('userMenu.accountLabel', 'Hồ sơ & Cá nhân hóa')}
          className="absolute end-0 mt-2.5 w-72
                     bg-slate-900/95 backdrop-blur-xl rounded-2xl
                     shadow-2xl border border-slate-700/80 p-2 z-[var(--z-dropdown,50)]
                     animate-scale-in-tl origin-top-right ring-1 ring-white/10"
        >
          {/* Header Thông tin Người Dùng */}
          <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1.5">
            <p className="font-bold text-sm truncate text-white">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wide">
                {user.role}
              </span>
              {user.role === 'SystemAdmin' ||
              (user.subscriptionTier || '').toUpperCase() === 'ENTERPRISE' ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                  ENTERPRISE
                </span>
              ) : user.isPremium || (user.subscriptionTier || '').toUpperCase() === 'VIP' ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PRO VIP
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  FREE
                </span>
              )}
            </div>
          </div>

          {/* NHÓM 1: Hồ Sơ & Bảo Mật Cá Nhân */}
          <div className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {t('userMenu.accountLabel', 'Hồ sơ & Bảo mật')}
            </div>

            {/* Hồ sơ cá nhân */}
            <button
              role="menuitem"
              onClick={() => handleNavigate('/profile')}
              className="w-full text-start px-3 py-2 flex items-center gap-2.5
                         text-xs font-semibold text-slate-200
                         hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer group"
            >
              <User className="w-4 h-4 text-cyan-400 group-hover:scale-105 transition-transform" />
              <div>
                <div className="text-white font-bold">{t('userMenu.profileInfo', 'Hồ sơ cá nhân & Danh tính')}</div>
                <div className="text-[10px] text-slate-400 font-normal">{t('userMenu.profileInfoDesc', 'Họ tên, email, avatar & thông tin')}</div>
              </div>
            </button>

            {/* Mật khẩu & 2FA */}
            <button
              role="menuitem"
              onClick={() => handleNavigate('/profile')}
              className="w-full text-start px-3 py-2 flex items-center gap-2.5
                         text-xs font-semibold text-slate-200
                         hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer group"
            >
              <Lock className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition-transform" />
              <div>
                <div className="text-white font-bold">{t('userMenu.security2fa', 'Mật khẩu & Bảo mật 2FA')}</div>
                <div className="text-[10px] text-slate-400 font-normal">{t('userMenu.security2faDesc', 'Đổi mật khẩu & xác thực hai bước')}</div>
              </div>
            </button>

            {/* Khóa AI Cá Nhân (BYOK) */}
            <button
              role="menuitem"
              onClick={() => handleNavigate('/profile')}
              className="w-full text-start px-3 py-2 flex items-center gap-2.5
                         text-xs font-semibold text-slate-200
                         hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer group"
            >
              <Key className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform" />
              <div>
                <div className="text-white font-bold">{t('userMenu.aiKeys', 'Khóa AI Riêng (BYOK Keys)')}</div>
                <div className="text-[10px] text-slate-400 font-normal">{t('userMenu.aiKeysDesc', 'Tự cấp khóa Gemini, OpenAI, Groq')}</div>
              </div>
            </button>

            {/* Gói cước & Quyền lợi */}
            <button
              role="menuitem"
              onClick={() => handleNavigate('/paywall')}
              className="w-full text-start px-3 py-2 flex items-center gap-2.5
                         text-xs font-semibold text-slate-200
                         hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer group"
            >
              <Award className="w-4 h-4 text-purple-400 group-hover:scale-105 transition-transform" />
              <div>
                <div className="text-white font-bold">{t('userMenu.subscription', 'Gói cước & Quyền lợi')}</div>
                <div className="text-[10px] text-slate-400 font-normal">{t('userMenu.subscriptionDesc', 'Trạng thái hạn mức & gói thành viên')}</div>
              </div>
            </button>
          </div>

          <div className="my-1.5 border-t border-slate-800/80" role="separator" />

          {/* NHÓM 2: Cá Nhân Hóa & Trải Nghiệm */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {t('userMenu.personalization', 'Cá nhân hóa & Trải nghiệm')}
            </div>

            {/* Toggle Âm thanh nhanh */}
            <div
              onClick={toggleSound}
              className="px-3 py-2 flex items-center justify-between
                         text-xs font-semibold text-slate-200
                         hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <div className="text-white font-bold">{t('userMenu.soundEffects', 'Âm thanh & Buzzer')}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {soundEnabled ? t('userMenu.soundEnabled', 'Đang bật') : t('userMenu.soundDisabled', 'Đang tắt')}
                  </div>
                </div>
              </div>
              <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Mục tiêu rèn luyện */}
            <div
              onClick={() => handleNavigate('/dashboard')}
              className="px-3 py-2 flex items-center justify-between
                         text-xs font-semibold text-slate-200
                         hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-white font-bold">{t('userMenu.dailyGoal', 'Mục tiêu rèn luyện')}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{t('userMenu.dailyGoalValue', '5 bài/ngày')}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30">
                60%
              </span>
            </div>

            {/* Ứng dụng Di Động (PWA & QR Bridge) */}
            <button
              role="menuitem"
              onClick={() => { setIsOpen(false); setIsMobileModalOpen(true); }}
              className="w-full text-start px-3 py-2 flex items-center justify-between
                         text-xs font-semibold text-slate-200
                         hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-cyan-400 group-hover:scale-105 transition-transform" />
                <div>
                  <div className="text-white font-bold">{t('userMenu.mobileApp', 'Ứng dụng Di động')}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{t('userMenu.mobileAppDesc', 'Cài đặt PWA & quét QR điện thoại')}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-300 px-1.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                PWA
              </span>
            </button>
          </div>

          <div className="my-1.5 border-t border-slate-800/80" role="separator" />

          {/* NHÓM 3: Cộng Đồng & Thao Tác Hệ Thống */}
          <div className="space-y-0.5">
            {/* Mời Cafe */}
            <button
              role="menuitem"
              onClick={() => { setIsOpen(false); setIsCoffeeOpen(true); }}
              className="w-full text-start px-3 py-2 flex items-center gap-2.5
                         text-xs font-semibold text-amber-300
                         hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-amber-300 font-bold">{t('userMenu.buyCoffee', 'Mời Cafe & Quỹ Máy Chủ')}</div>
                <div className="text-[10px] text-slate-400 font-normal">{t('userMenu.buyCoffeeDesc', 'Đồng hành & hỗ trợ tài nguyên')}</div>
              </div>
            </button>

            {/* Đăng xuất */}
            <button
              role="menuitem"
              onClick={() => { setIsOpen(false); logout(); }}
              className="w-full text-start px-3 py-2 flex items-center gap-2.5
                         text-xs font-bold text-rose-400
                         hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer mt-1"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>{t('userMenu.logout', 'Đăng xuất')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Mời Cafe */}
      <BuyMeCoffeeModal isOpen={isCoffeeOpen} onClose={() => setIsCoffeeOpen(false)} />

      {/* Modal Cài Đặt App Di Động & QR Bridge */}
      <MobileAppInstallModal isOpen={isMobileModalOpen} onClose={() => setIsMobileModalOpen(false)} />
    </div>
  );
}
