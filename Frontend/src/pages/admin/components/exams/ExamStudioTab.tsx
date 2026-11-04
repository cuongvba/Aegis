import { useState } from 'react';
import { Sliders, Lock, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { ExamStudioMatrixModal } from './ExamStudioMatrixModal';

export interface ExamPaperSummary {
  id: string;
  trackId: string;
  paperCode: string;
  title: string;
  generationMode: string;
  durationMinutes: number;
  passingScorePercent: number;
  totalQuestions: number;
  isSealed: boolean;
  cryptographicHashSha256?: string;
  assignedCandidatesCount: number;
  items: Array<{
    id: string;
    questionId: string;
    orderIndex: number;
    customWeight: number;
    isPinned: boolean;
    questionTitle: string;
    topic: string;
    questionType: string;
  }>;
}

export interface ExamTrack {
  id: string;
  trackName: string;
  description: string;
  papers: ExamPaperSummary[];
}

interface ExamStudioTabProps {
  campaignId: string;
  tracks: ExamTrack[];
  onRefresh: () => void;
}

export function ExamStudioTab({ campaignId, tracks, onRefresh }: ExamStudioTabProps) {
  const { t } = useTranslation('admin');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || '');
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const activeTrack = tracks.find(tr => tr.id === selectedTrackId) || tracks[0];

  const handleSealPaper = async (paperId: string) => {
    setLoadingAction(true);
    try {
      await api.post(`/api/exam-campaigns/${campaignId}/papers/${paperId}/seal`);
      setActionMessage(t('exams.studio.successSeal', 'Đã niêm phong mật mã SHA-256 cho bộ đề thành công! Đề thi đã khóa bất biến.'));
      onRefresh();
    } catch {
      setActionMessage('Có lỗi khi niêm phong đề thi.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sliders className="text-blue-400" size={20} />
            <span>{t('exams.studio.title', 'Xưởng Thiết Kế Đề Thi Lưỡng Diện (Exam Studio)')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('exams.studio.subtitle', 'Hỗ trợ 3 chế độ: Tự động Ma trận 5 Trục UCTE, Bán tự động Hoán đổi IRT 3-PL, và Thủ công chọn từng câu.')}
          </p>
        </div>

        <button
          onClick={() => setShowAutoModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-300 hover:to-cyan-300 rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
        >
          <Sparkles size={15} />
          <span>{t('exams.studio.btnAutoMatrix', 'SINH TỰ ĐỘNG (MA TRẬN %)')}</span>
        </button>
      </div>

      {actionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle size={15} className="shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* TRACK SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {tracks.map(t_item => (
          <button
            key={t_item.id}
            onClick={() => setSelectedTrackId(t_item.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedTrackId === t_item.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {t_item.trackName} ({t_item.papers.length} {t('exams.studio.trackPapers', 'bộ đề')})
          </button>
        ))}
      </div>

      {/* PAPERS IN SELECTED TRACK */}
      <div className="space-y-4">
        {activeTrack?.papers.map(p => (
          <div key={p.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 font-bold">
                  {p.paperCode}
                </span>
                <h3 className="text-sm font-black text-white">{p.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  p.generationMode === 'Automated' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  p.generationMode === 'Hybrid' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {p.generationMode}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {p.isSealed ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck size={14} /> {t('exams.studio.sealedBadge', 'ĐÃ NIÊM PHONG SHA-256')}
                  </span>
                ) : (
                  <button
                    onClick={() => handleSealPaper(p.id)}
                    disabled={loadingAction}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    <Lock size={13} /> {t('exams.studio.btnSeal', 'Niêm phong Đề thi')}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
              <div>{t('exams.studio.duration', 'Thời lượng')}: <strong className="text-white">{p.durationMinutes} phút</strong></div>
              <div>{t('exams.studio.totalQuestions', 'Số câu hỏi')}: <strong className="text-white">{p.totalQuestions} câu</strong></div>
              <div>{t('exams.studio.passingScore', 'Điểm chuẩn đạt')}: <strong className="text-emerald-400">{p.passingScorePercent}%</strong></div>
              <div>{t('exams.studio.assignedCount', 'Thí sinh được gán')}: <strong className="text-cyan-400">{p.assignedCandidatesCount} người</strong></div>
            </div>

            {p.cryptographicHashSha256 && (
              <div className="text-[10px] font-mono text-slate-500 break-all bg-black/40 px-3 py-1.5 rounded-lg border border-slate-850">
                {t('exams.studio.merkleHash', 'Chữ ký Merkle băm')}: {p.cryptographicHashSha256}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADVANCED BLUEPRINT MATRIX & TIMING MODAL */}
      {showAutoModal && activeTrack && (
        <ExamStudioMatrixModal
          campaignId={campaignId}
          trackId={activeTrack.id}
          onClose={() => setShowAutoModal(false)}
          onSuccess={(msg) => {
            setActionMessage(msg);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
