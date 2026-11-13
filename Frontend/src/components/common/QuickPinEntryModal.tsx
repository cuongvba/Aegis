import React, { useState } from 'react';
import { KeyRound, ArrowRight, User, X, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '@/app/providers/AuthProvider';

interface QuickPinEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PINS = [
  { pin: 'GUEST_SHOW', label: '🌟 Đề Thử Nghiệm 9 Dạng' },
  { pin: 'DRIVE_60', label: '🚗 60 Câu Điểm Liệt' },
  { pin: 'BANK_AML', label: '🏦 Nghiệp Vụ Ngân Hàng' },
];

export const QuickPinEntryModal: React.FC<QuickPinEntryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [pin, setPin] = useState<string>('');
  const [studentName, setStudentName] = useState<string>(() => {
    return user?.name || localStorage.getItem('aegis_guest_student_name') || '';
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().toUpperCase();
    if (!cleanPin) {
      setError(t('quickPin.errorEmpty', 'Vui lòng nhập mã phòng thi hoặc mã đề thi.'));
      return;
    }

    if (!user && studentName.trim()) {
      localStorage.setItem('aegis_guest_student_name', studentName.trim());
    }

    onClose();
    navigate(`/practice?topic=${encodeURIComponent(cleanPin)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Tiêu đề & Icon */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <KeyRound size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              {t('quickPin.title', 'Vào Phòng Thi Bằng Mã PIN')}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                0-Friction
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('quickPin.subtitle', 'Nhập mã phòng thi từ Thầy/Cô để làm bài thi trực tiếp tức thì')}
            </p>
          </div>
        </div>

        {/* Form nhập PIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t('quickPin.pinLabel', 'Mã Đề / Mã Phòng Thi (PIN):')}
            </label>
            <input
              type="text"
              autoFocus
              maxLength={20}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="VÍ DỤ: TOAN12, 839201"
              className="w-full text-center tracking-widest text-lg font-mono font-black uppercase bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-cyan-400" />
                <span>{t('quickPin.nameLabel', 'Họ và tên của bạn (để Thầy/Cô ghi điểm):')}</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An - Lớp 12A1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Gợi ý mã đề thi thử */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              <span>{t('quickPin.samples', 'Hoặc chọn phòng thi thử nghiệm:')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PINS.map((s) => (
                <button
                  key={s.pin}
                  type="button"
                  onClick={() => {
                    setPin(s.pin);
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[11px] font-mono font-semibold text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              {t('common.cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer"
            >
              <span>{t('quickPin.enterExam', 'Vào Phòng Thi Ngay')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

