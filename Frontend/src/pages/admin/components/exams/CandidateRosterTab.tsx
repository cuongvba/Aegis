import { useState, useEffect } from 'react';
import { Users, Filter, Wand2, Edit3, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import type { ExamPaperSummary } from './ExamStudioTab';

export interface CandidateAllocation {
  id: string;
  candidateIdentifier: string;
  fullName: string;
  email: string;
  orgUnitPath: string;
  jobTitle: string;
  assignedExamPaperId?: string;
  assignedPaperTitle: string;
  assignedPaperCode: string;
  allocationSource: string;
  overrideReason?: string;
  shiftCode?: string;
  roomLabId?: string;
  status: string;
  score?: number;
  scorePercentage?: number;
  passed?: boolean;
}

interface CandidateRosterTabProps {
  campaignId: string;
  availablePapers: ExamPaperSummary[];
}

export function CandidateRosterTab({ campaignId, availablePapers }: CandidateRosterTabProps) {
  const { t } = useTranslation('admin');
  const [candidates, setCandidates] = useState<CandidateAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgFilter, setOrgFilter] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAllocation | null>(null);
  const [targetPaperId, setTargetPaperId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/exam-campaigns/${campaignId}/candidates`, {
        params: { orgFilter: orgFilter || undefined }
      });
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [campaignId, orgFilter]);

  const handleAutoAllocate = async () => {
    setProcessing(true);
    try {
      const res = await api.post(`/api/exam-campaigns/${campaignId}/candidates/auto-allocate`);
      setActionMessage(res.data.message || 'Đã tự động gán đề thi theo Cây Tổ Chức O(1) thành công!');
      fetchCandidates();
    } finally {
      setProcessing(false);
    }
  };

  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !targetPaperId) return;
    setProcessing(true);
    try {
      await api.post(`/api/exam-campaigns/${campaignId}/candidates/manual-override`, {
        candidateIds: [selectedCandidate.id],
        targetExamPaperId: targetPaperId,
        reason: overrideReason || 'Ban tổ chức điều chỉnh theo nguyện vọng chuyên môn'
      });
      setActionMessage(`Đã đổi đề thi cho thí sinh ${selectedCandidate.fullName} thành công!`);
      setSelectedCandidate(null);
      fetchCandidates();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="text-purple-400" size={20} />
            <span>{t('exams.roster.title', 'Ma Trận Điều Phối Thí Sinh (Candidate Allocation Matrix)')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('exams.roster.subtitle', 'Quản trị 4 kênh phân bổ: Tự động Cây O(1), Thí sinh tự đăng ký, Điều chỉnh thủ công, và Nạp Excel.')}
          </p>
        </div>

        <button
          onClick={handleAutoAllocate}
          disabled={processing}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-300 hover:to-indigo-300 rounded-xl transition shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
        >
          <Wand2 size={15} />
          <span>{t('exams.roster.btnAutoAllocate', 'TỰ ĐỘNG GÁN CÂY O(1)')}</span>
        </button>
      </div>

      {actionMessage && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl px-4 py-2.5 text-purple-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <Filter size={15} className="text-slate-400" />
        <input
          type="text"
          placeholder={t('exams.roster.filterPlaceholder', 'Lọc theo Chi nhánh, Phòng ban, SBD hoặc Họ tên...')}
          value={orgFilter}
          onChange={e => setOrgFilter(e.target.value)}
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
        />
        <span className="text-[11px] font-mono text-slate-500">
          {t('exams.roster.totalCandidates', 'Tổng số')}: {candidates.length}
        </span>
      </div>

      {/* CANDIDATES TABLE */}
      <div className="rounded-3xl border border-slate-800 overflow-hidden bg-slate-900/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] bg-slate-950/60">
                <th className="p-3.5">{t('exams.roster.colId', 'SBD')}</th>
                <th className="p-3.5">{t('exams.roster.colName', 'Họ và tên')}</th>
                <th className="p-3.5">{t('exams.roster.colOrg', 'Đơn vị (Cây O1)')}</th>
                <th className="p-3.5">{t('exams.roster.colJob', 'Chức danh')}</th>
                <th className="p-3.5">{t('exams.roster.colPaper', 'Đề thi được gán')}</th>
                <th className="p-3.5">{t('exams.roster.colSource', 'Nguồn gán')}</th>
                <th className="p-3.5">{t('exams.roster.colStatus', 'Trạng thái')}</th>
                <th className="p-3.5 text-right">{t('exams.roster.colActions', 'Điều chỉnh')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-3.5 font-mono text-cyan-400 font-bold">{c.candidateIdentifier}</td>
                  <td className="p-3.5 font-bold text-white">{c.fullName}</td>
                  <td className="p-3.5 text-slate-400 text-[11px]">{c.orgUnitPath}</td>
                  <td className="p-3.5 text-slate-300 font-medium">{c.jobTitle}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-blue-400">{c.assignedPaperTitle}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {c.allocationSource}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      c.status === 'InProgress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedCandidate(c);
                        setTargetPaperId(c.assignedExamPaperId || availablePapers[0]?.id || '');
                        setOverrideReason('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={11} /> {t('exams.roster.btnChangePaper', 'Đổi đề')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ĐIỀU CHỈNH ĐỀ THỦ CÔNG */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleManualOverride} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4">
            <h3 className="text-base font-black text-white">{t('exams.roster.overrideModalTitle', 'Điều chỉnh Đề thi Cho Thí sinh')}</h3>
            <p className="text-xs text-slate-400">
              {t('exams.roster.overrideModalSubtitle', 'Thí sinh')}: <strong className="text-white">{selectedCandidate.fullName}</strong> ({selectedCandidate.candidateIdentifier})
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">{t('exams.roster.selectPaperLabel', 'Chọn đề thi mới muốn gán')}</label>
                <select
                  value={targetPaperId}
                  onChange={e => setTargetPaperId(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {availablePapers.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.paperCode}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">{t('exams.roster.overrideReasonLabel', 'Lý do điều chỉnh (Vết kiểm toán)')}</label>
                <input
                  type="text"
                  placeholder={t('exams.roster.overrideReasonPlaceholder', 'VD: Cán bộ đăng ký thi chuyển ngạch theo nguyện vọng')}
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                HỦY
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-5 py-2.5 text-xs font-black text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-xl transition cursor-pointer"
              >
                {t('exams.roster.btnSaveOverride', 'LƯU ĐIỀU CHỈNH')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
