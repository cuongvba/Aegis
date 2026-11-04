import { useState } from 'react';
import { Calendar, Plus, Layers, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CampaignSummary {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  executionPolicy: string;
  allowCandidateSelfSelect: boolean;
  totalTracks: number;
  totalPapers: number;
  totalCandidates: number;
  completedCandidates: number;
  passRatePercent: number;
  createdAt: string;
}

interface CampaignListTabProps {
  campaigns: CampaignSummary[];
  selectedCampaignId: string;
  onSelectCampaign: (id: string) => void;
  onCreateCampaign: (title: string, desc: string, trackNames: string[]) => Promise<void>;
  loading: boolean;
}

export function CampaignListTab({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  onCreateCampaign,
  loading
}: CampaignListTabProps) {
  const { t, i18n } = useTranslation('admin');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTracks, setNewTracks] = useState('Nghiệp vụ KHCN, Nghiệp vụ KHDN, Kế toán Ngân quỹ');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const tracks = newTracks.split(',').map(s => s.trim()).filter(Boolean);
      await onCreateCampaign(newTitle, newDesc, tracks);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Layers className="text-cyan-400" size={20} />
            <span>{t('exams.campaigns.title', 'Danh sách Chiến dịch Khảo thí Doanh nghiệp & Học đường')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('exams.campaigns.subtitle', 'Quản lý các đợt thi tập trung quy mô lớn, kỳ thi nghiệp vụ phân tầng và thi học kỳ.')}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>{t('exams.campaigns.btnCreate', 'TẠO CHIẾN DỊCH MỚI')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campaigns.map((c) => {
          const isSelected = c.id === selectedCampaignId;
          return (
            <div
              key={c.id}
              onClick={() => onSelectCampaign(c.id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl ${
                isSelected
                  ? 'bg-cyan-950/20 border-cyan-500/60 shadow-xl shadow-cyan-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {c.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                      <Shield size={11} /> {c.executionPolicy}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                    {c.title}
                  </h3>
                </div>
                {isSelected && (
                  <span className="px-3 py-1 rounded-xl bg-cyan-500 text-slate-950 text-[11px] font-black shrink-0">
                    {t('exams.selectedCampaign', 'ĐANG CHỌN')}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                {c.description || 'Chiến dịch khảo thí chuẩn hóa toàn tổ chức.'}
              </p>

              <div className="grid grid-cols-4 gap-2 py-3 px-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-center mb-4">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{t('exams.campaigns.tracks', 'Phân nhánh')}</div>
                  <div className="text-sm font-black text-cyan-400">{c.totalTracks}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{t('exams.campaigns.papers', 'Bộ đề thi')}</div>
                  <div className="text-sm font-black text-blue-400">{c.totalPapers}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{t('exams.campaigns.candidates', 'Thí sinh')}</div>
                  <div className="text-sm font-black text-purple-400">{c.totalCandidates}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{t('exams.campaigns.passRate', 'Tỷ lệ đỗ')}</div>
                  <div className="text-sm font-black text-emerald-400">{c.passRatePercent}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(c.startDate).toLocaleDateString(i18n.language || 'vi-VN')} - {new Date(c.endDate).toLocaleDateString(i18n.language || 'vi-VN')}
                </span>
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  {t('exams.campaigns.manageDetail', 'Quản trị chi tiết')} <ArrowRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL TẠO CHIẾN DỊCH */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-black text-white">{t('exams.campaigns.modalTitle', 'Khởi tạo Chiến dịch Khảo thí Mới')}</h3>
            <p className="text-xs text-slate-400">{t('exams.campaigns.modalSubtitle', 'Thiết lập kỳ thi tổng thể cho toàn doanh nghiệp hoặc trường học.')}</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">{t('exams.campaigns.nameLabel', 'Tên chiến dịch / Kỳ thi')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('exams.campaigns.namePlaceholder', 'VD: Hội thi Nghiệp vụ Agribank 2026')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">{t('exams.campaigns.descLabel', 'Mô tả kỳ thi')}</label>
                <textarea
                  rows={2}
                  placeholder={t('exams.campaigns.descPlaceholder', 'VD: Đánh giá chuẩn hóa năng lực cán bộ chuyên môn toàn hệ thống...')}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">{t('exams.campaigns.tracksLabel', 'Danh sách Phân nhánh chuyên môn (cách nhau dấu phẩy)')}</label>
                <input
                  type="text"
                  value={newTracks}
                  onChange={(e) => setNewTracks(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
              >
                {t('exams.campaigns.btnCancel', 'HỦY BỎ')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition"
              >
                {submitting ? t('exams.campaigns.submitting', 'ĐANG TẠO...') : t('exams.campaigns.btnSubmit', 'TẠO CHIẾN DỊCH')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
