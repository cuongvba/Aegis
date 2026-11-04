import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Check, RefreshCw, Save, AlertCircle, ShieldCheck, Link2, Coffee, Gift } from 'lucide-react';
import api from '@/services/api';

interface CampaignPolicy {
  campaignCode: string;
  campaignName: string;
  description: string;
  trialDays: number;
  revenueShareRate: number;
  karmaBonusPoints: number;
  coffeeProDays: number;
  coffeePriceVnd: number;
  coffeeBankBin?: string;
  coffeeAccountNumber?: string;
  coffeeAccountName?: string;
  isActive?: boolean;
}

export const CreatorCampaignSection: React.FC = () => {
  const { t } = useTranslation('admin_payments');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState<CampaignPolicy>({
    campaignCode: 'SPRING_EDUCATOR_2026',
    campaignName: 'Chương Trình Đồng Hành Sư Phạm Toàn Cầu 2026',
    description: 'Chính sách ưu đãi tri ân Thầy Cô và Chuyên gia giáo dục: Dùng thử toàn năng, chia sẻ doanh thu và mở khóa 7 ngày Pro qua 1 ly cafe.',
    trialDays: 60,
    revenueShareRate: 0.75,
    karmaBonusPoints: 100,
    coffeeProDays: 7,
    coffeePriceVnd: 25000,
    coffeeBankBin: '970405',
    coffeeAccountNumber: '8888912600688',
    coffeeAccountName: 'NGUYEN VIET CUONG',
    isActive: true,
  });

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/creator/studio/marketing-policy');
      if (res.data) {
        setForm((prev) => ({ ...prev, ...res.data, isActive: true }));
      }
    } catch (err) {
      console.error('Fetch marketing policy failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.post('/api/creator/studio/admin/policies', {
        campaignCode: form.campaignCode,
        campaignName: form.campaignName,
        description: form.description,
        trialDays: Number(form.trialDays),
        revenueShareRate: Number(form.revenueShareRate),
        karmaBonusPoints: Number(form.karmaBonusPoints),
        coffeeProDays: Number(form.coffeeProDays) || 7,
        coffeePriceVnd: Number(form.coffeePriceVnd),
        isActive: form.isActive ?? true,
      });

      setStatusMsg({ type: 'success', text: t('campaign.saveSuccess', 'Đã lưu chính sách tiếp thị thành công! Áp dụng 0ms trên toàn hệ sinh thái.') });
      setTimeout(() => setStatusMsg(null), 4000);
      fetchPolicy();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || t('campaign.saveError', 'Có lỗi khi lưu chính sách tiếp thị.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const sharePercent = Math.round(form.revenueShareRate * 100);

  return (
    <div className="space-y-6">
      {/* SSoT Treasury Connection Notice */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 flex items-start gap-3">
        <Link2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-cyan-300 block mb-0.5 font-bold">
            {t('campaign.headerBadge', 'MARKETING CAMPAIGN CENTRAL ENGINE • NoHC & OCP')}
          </strong>
          {t('campaign.bankInfoNote', 'Thông tin thanh toán ngân hàng thụ hưởng được kết nối SSoT thời gian thực từ cấu hình thanh toán tập trung.')} ({form.coffeeBankBin} - {form.coffeeAccountNumber} - {form.coffeeAccountName})
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{t('campaign.title', 'Chính Sách Tiếp Thị & Chia Sẻ Doanh Thu Creator')}</h3>
                <p className="text-xs text-slate-400">{t('campaign.subtitle', 'Cấu hình tập trung quyền lợi cho Thầy Cô.')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchPolicy}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {statusMsg && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('campaign.codeLabel', 'Mã Chiến Dịch')}</label>
              <input
                type="text"
                value={form.campaignCode}
                onChange={(e) => setForm({ ...form, campaignCode: e.target.value.toUpperCase() })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('campaign.trialDaysLabel', 'Thời Gian Dùng Thử (Ngày)')}</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('campaign.nameLabel', 'Tên Chiến Dịch')}</label>
            <input
              type="text"
              value={form.campaignName}
              onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('campaign.revShareLabel', 'Chia Sẻ Doanh Thu')} ({sharePercent}%)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.95"
                value={form.revenueShareRate}
                onChange={(e) => setForm({ ...form, revenueShareRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('campaign.karmaBonusLabel', 'Thưởng Karma')}</label>
              <input
                type="number"
                min={0}
                value={form.karmaBonusPoints}
                onChange={(e) => setForm({ ...form, karmaBonusPoints: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('campaign.coffeePriceLabel', 'Giá 1 Ly Cafe (VNĐ)')}</label>
              <input
                type="number"
                step={1000}
                min={5000}
                value={form.coffeePriceVnd}
                onChange={(e) => setForm({ ...form, coffeePriceVnd: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                {t('campaign.coffeeProDaysLabel', 'Thời Gian Mở Khóa Pro Khi Mời Cafe (Ngày)')}
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.coffeeProDays}
                onChange={(e) => setForm({ ...form, coffeeProDays: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('campaign.activeStatus', 'Trạng Thái Kích Hoạt')}</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive ?? true}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-3 text-xs font-medium text-slate-300">
                    {form.isActive ? t('campaign.activeStatus', 'Đang kích hoạt') : t('campaign.pausedStatus', 'Tạm dừng')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? t('campaign.saving', 'Đang lưu...') : t('campaign.btnSave', 'Lưu Chính Sách Tiếp Thị')}</span>
          </button>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('campaign.previewTitle', 'Xem Trước Trực Quan')}</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-teal-500/15 to-indigo-600/20 border border-emerald-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 truncate max-w-[180px]">{form.campaignName}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/30 text-emerald-300">
                  {form.trialDays} Ngày
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {t('campaign.trialBannerDesc', { share: sharePercent, karma: form.karmaBonusPoints })}
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <Gift className="w-3 h-3 text-emerald-400" />
                <span>CRT9999</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  {t('campaign.coffeeCardTitle', 'Mời 1 Ly Cafe')}
                </span>
                <span className="font-mono font-bold text-amber-400">{form.coffeePriceVnd.toLocaleString('vi-VN')}đ</span>
              </div>
              <p className="text-[11px] text-slate-400">{t('campaign.coffeeDesc', { days: form.coffeeProDays })}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
