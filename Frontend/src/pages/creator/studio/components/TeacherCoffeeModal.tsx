import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Coffee, Heart, Check, ShieldCheck, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { antiScrapingGuardService } from '@/services/antiScrapingGuard.service';
import { buildVietQrPayload } from '@/utils/vietQrHelper';
import { EducatorPartnershipInfo } from '../types/zen-studio.types';

interface TeacherCoffeeModalProps {
  partnership?: EducatorPartnershipInfo | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherCoffeeModal: React.FC<TeacherCoffeeModalProps> = ({
  partnership,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('creator');
  const [selectedPlan, setSelectedPlan] = useState<'COFFEE' | 'HEART'>('COFFEE');
  const [isActivated, setIsActivated] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Cấu hình linh động từ Marketing Campaign Policy
  const coffeeDays = partnership?.coffeeProDays || 7; // NGHIÊM NGẶT 7 NGÀY (1 TUẦN)
  const amount = selectedPlan === 'COFFEE' ? (partnership?.coffeePriceVnd || 25000) : 0;
  const bankBin = partnership?.coffeeBankBin || '970405';
  const accNum = partnership?.coffeeAccountNumber || '8888912600688';
  const accName = partnership?.coffeeAccountName || 'AEGIS GLOBAL TREASURY';
  const teacherCode = partnership?.referralCode || 'CRTE4';
  const transferMsg = `CAFE ${teacherCode}`;

  const vietQrString = useMemo(() => {
    return buildVietQrPayload({
      bankBin,
      accountNumber: accNum,
      amount,
      message: transferMsg,
    });
  }, [bankBin, accNum, amount, transferMsg]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleConfirm = () => {
    if (selectedPlan === 'HEART') {
      antiScrapingGuardService.activateCoffeePass(365, true);
    } else {
      // Đúng tôn chỉ: Mời 1 ly cafe mở khóa Pro đúng 1 tuần (7 ngày)
      antiScrapingGuardService.activateCoffeePass(coffeeDays, false);
    }

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    setIsActivated(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-slate-100 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
            <Coffee className="w-3.5 h-3.5" />
            <span>{t('coffee.badge')}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {t('coffee.title')}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {t('coffee.subtitle')}
          </p>
        </div>

        {/* 2 Lựa chọn tinh tế: Mời Cafe 7 ngày HOẶC Bảo trợ Vùng Cao 0đ */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSelectedPlan('COFFEE')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
              selectedPlan === 'COFFEE'
                ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/40 text-white shadow-lg'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl mb-1">☕</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-bold uppercase">
                {coffeeDays} {t('coffee.daysProSuffix', 'Ngày Pro')}
              </span>
            </div>
            <div className="text-sm font-black text-slate-100">{t('coffee.planCoffeeTitle')}</div>
            <div className="text-xs font-mono font-bold text-amber-400">
              {amount > 0 ? `${amount.toLocaleString('vi-VN')}đ` : '25.000đ'}
            </div>
            <span className="text-[10px] text-slate-300 mt-1 block">
              {t('coffee.planCoffeeDesc', { days: coffeeDays })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan('HEART')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
              selectedPlan === 'HEART'
                ? 'border-rose-400 bg-rose-500/20 ring-2 ring-rose-400/40 text-white shadow-lg'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl mb-1">💖</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-bold">
                AEGIS HEART
              </span>
            </div>
            <div className="text-sm font-black text-slate-100">{t('coffee.planHeartTitle')}</div>
            <div className="text-xs font-mono font-bold text-rose-400">{t('coffee.planHeartFree')}</div>
            <span className="text-[10px] text-slate-300 mt-1 block">
              {t('coffee.planHeartDesc')}
            </span>
          </button>
        </div>

        {/* Nội dung thanh toán VietQR Napas EMVCo */}
        {selectedPlan === 'COFFEE' ? (
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-4 mb-4">
            <div className="p-2 bg-white rounded-2xl shadow-lg shrink-0 flex items-center justify-center">
              <QRCodeSVG value={vietQrString} size={105} level="M" includeMargin />
            </div>
            <div className="text-xs space-y-1.5 flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                {t('coffee.qrTitle')}
              </span>
              <div className="flex items-center justify-between gap-1 text-slate-200">
                <span className="text-slate-400">{t('coffee.stk')} <strong className="text-white">{accNum}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopy(accNum, 'stk')}
                  className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                  title={t('coffee.copyText')}
                >
                  {copiedField === 'stk' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-slate-200">
                <span className="text-slate-400">{t('coffee.amount')} </span>
                <strong className="text-amber-400 font-mono">{amount.toLocaleString('vi-VN')}đ</strong>
              </div>
              <div className="flex items-center justify-between gap-1 text-slate-200">
                <span className="text-slate-400 truncate">{t('coffee.msg')} <strong className="text-emerald-400 font-mono">{transferMsg}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopy(transferMsg, 'msg')}
                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition shrink-0"
                  title={t('coffee.copyText')}
                >
                  {copiedField === 'msg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <span className="text-[9px] text-slate-500 block pt-0.5">
                {t('coffee.autoDetect')}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 mb-4 leading-relaxed flex items-start gap-3">
            <Heart className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">{t('coffee.heartNoticeTitle')}</strong>
              {t('coffee.heartNoticeDesc')}
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <button
          onClick={handleConfirm}
          disabled={isActivated}
          className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          {isActivated ? (
            <>
              <Check className="w-4 h-4 text-slate-950" />
              <span>{t('coffee.btnSuccess')}</span>
            </>
          ) : selectedPlan === 'HEART' ? (
            <>
              <Heart className="w-4 h-4 fill-current" />
              <span>{t('coffee.btnHeartConfirm')}</span>
            </>
          ) : (
            <>
              <Coffee className="w-4 h-4" />
              <span>{t('coffee.btnCoffeeConfirm', { days: coffeeDays })}</span>
            </>
          )}
        </button>

        {/* Chân trang an ninh */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono mt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('coffee.securityFooter')}</span>
        </div>
      </div>
    </div>
  );
};
export default TeacherCoffeeModal;
