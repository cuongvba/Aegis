import { useState, useEffect } from 'react';
import { Award, Trophy, BarChart3, Building, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';

export interface CampaignResultsAnalytics {
  campaignId: string;
  campaignTitle: string;
  totalCandidates: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  exemptedCount: number;
  averageScorePercent: number;
  highestScorePercent: number;
  passRatePercent: number;
  scoreBuckets: Array<{
    rangeLabel: string;
    count: number;
    percentage: number;
  }>;
  orgPerformance: Array<{
    orgUnitName: string;
    totalCandidates: number;
    completedCandidates: number;
    averageScore: number;
    passRatePercent: number;
  }>;
  leaderboard: Array<{
    rank: number;
    candidateIdentifier: string;
    fullName: string;
    orgUnitPath: string;
    paperTitle: string;
    scorePercentage: number;
    timeSpent: string;
    passed: boolean;
  }>;
}

interface ExamResultsTabProps {
  campaignId: string;
}

export function ExamResultsTab({ campaignId }: ExamResultsTabProps) {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<CampaignResultsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/exam-campaigns/${campaignId}/results`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [campaignId]);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs font-mono">
        {t('exams.syncing', 'Đang nạp dữ liệu phân tích kết quả cuộc thi...')}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            <span>{t('exams.results.title', 'Báo Cáo Phân Tích Kết Quả & Phổ Điểm Thực Hiện')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('exams.results.subtitle', 'Phân tích tự động chuẩn hóa năng lực, tỷ lệ đỗ và vinh danh theo từng đơn vị/chi nhánh.')}
          </p>
        </div>

        <button
          onClick={fetchResults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <RefreshCw size={13} /> {t('exams.results.btnRefresh', 'Làm mới')}
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[10px] font-bold uppercase text-slate-500">
            {t('exams.results.kpiCompleted', 'Đã hoàn thành')}
          </div>
          <div className="text-xl font-black text-white mt-1">
            {data.completedCount} <span className="text-xs text-slate-500 font-normal">/ {data.totalCandidates}</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-semibold mt-1">
            {data.inProgressCount} {t('exams.results.inProgress', 'đang thi')} • {data.notStartedCount} {t('exams.results.notStarted', 'chưa thi')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[10px] font-bold uppercase text-slate-500">
            {t('exams.results.kpiAverage', 'Điểm trung bình')}
          </div>
          <div className="text-xl font-black text-blue-400 mt-1">{data.averageScorePercent}%</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">
            {t('exams.results.scale100', 'Thang điểm 100%')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[10px] font-bold uppercase text-slate-500">
            {t('exams.results.kpiHighest', 'Điểm cao nhất (Thủ khoa)')}
          </div>
          <div className="text-xl font-black text-amber-400 mt-1">{data.highestScorePercent}%</div>
          <div className="text-[11px] text-amber-300/80 font-semibold mt-1">Top 1</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[10px] font-bold uppercase text-slate-500">
            {t('exams.results.kpiPassRate', 'Tỷ lệ Đạt chuẩn')}
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">{data.passRatePercent}%</div>
          <div className="text-[11px] text-emerald-400/80 font-semibold mt-1">
            {t('exams.results.passed', 'ĐẠT')}
          </div>
        </div>
      </div>

      {/* SCORE DISTRIBUTION & ORG BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PHỔ ĐIỂM */}
        <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <BarChart3 size={15} className="text-cyan-400" /> {t('exams.results.scoreDistributionTitle', 'Phổ Điểm Toàn Kỳ Thi')}
          </h3>
          <div className="space-y-2 pt-1">
            {data.scoreBuckets.map((b, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{b.rangeLabel}</span>
                  <span className="font-mono font-bold text-white">{b.count} ({b.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THỐNG KÊ CHI NHÁNH */}
        <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Building size={15} className="text-purple-400" /> {t('exams.results.branchPerformanceTitle', 'Hiệu Suất Theo Đơn Vị / Chi Nhánh')}
          </h3>
          <div className="space-y-2 pt-1">
            {data.orgPerformance.map((org, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{org.orgUnitName}</div>
                  <div className="text-[11px] text-slate-500">
                    {org.completedCandidates}/{org.totalCandidates} {t('exams.results.completedCount', 'cán bộ đã thi')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-cyan-400">{org.averageScore}%</div>
                  <div className="text-[10px] text-emerald-400 font-bold">
                    {t('exams.results.passRateLabel', 'Đỗ')} {org.passRatePercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEADERBOARD TOP 10 */}
      <div className="rounded-3xl border border-slate-800 overflow-hidden bg-slate-900/40 backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <Award size={17} className="text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {t('exams.results.leaderboardTitle', 'Bảng Vinh Danh Top Thí Sinh Xuất Sắc')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] bg-slate-950/60">
                <th className="p-3 w-16 text-center">{t('exams.results.colRank', 'Hạng')}</th>
                <th className="p-3">{t('exams.results.colId', 'SBD')}</th>
                <th className="p-3">{t('exams.results.colName', 'Họ và tên')}</th>
                <th className="p-3">{t('exams.results.colOrg', 'Đơn vị')}</th>
                <th className="p-3">{t('exams.results.colPaper', 'Đề thi')}</th>
                <th className="p-3 text-right">{t('exams.results.colScore', 'Điểm số')}</th>
                <th className="p-3 text-center">{t('exams.results.colResult', 'Kết quả')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {data.leaderboard.map((item) => (
                <tr key={item.candidateIdentifier} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-3 text-center font-black">
                    {item.rank === 1 && <span className="text-amber-400 font-bold">🥇 1</span>}
                    {item.rank === 2 && <span className="text-slate-300 font-bold">🥈 2</span>}
                    {item.rank === 3 && <span className="text-amber-600 font-bold">🥉 3</span>}
                    {item.rank > 3 && <span className="text-slate-500 font-mono">#{item.rank}</span>}
                  </td>
                  <td className="p-3 font-mono text-cyan-400 font-bold">{item.candidateIdentifier}</td>
                  <td className="p-3 font-bold text-white">{item.fullName}</td>
                  <td className="p-3 text-slate-400 text-[11px]">{item.orgUnitPath}</td>
                  <td className="p-3 text-slate-300 text-[11px]">{item.paperTitle}</td>
                  <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                    {item.scorePercentage}%
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {t('exams.results.passed', 'ĐẠT')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
