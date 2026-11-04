import { useState, useEffect } from 'react';
import { Layers, Sliders, Users, Trophy, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { CampaignListTab, type CampaignSummary } from './components/exams/CampaignListTab';
import { ExamStudioTab, type ExamTrack } from './components/exams/ExamStudioTab';
import { CandidateRosterTab } from './components/exams/CandidateRosterTab';
import { ExamResultsTab } from './components/exams/ExamResultsTab';

type ActiveTabType = 'CAMPAIGNS' | 'STUDIO' | 'ROSTER' | 'RESULTS';

export function AdminExamsPage() {
  const { t } = useTranslation('admin');
  const [activeTab, setActiveTab] = useState<ActiveTabType>('CAMPAIGNS');
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [currentTracks, setCurrentTracks] = useState<ExamTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/exam-campaigns');
      setCampaigns(res.data);
      if (res.data.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignDetail = async (id: string) => {
    if (!id) return;
    try {
      const res = await api.get(`/api/exam-campaigns/${id}`);
      setCurrentTracks(res.data.tracks || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignDetail(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const handleCreateCampaign = async (title: string, desc: string, trackNames: string[]) => {
    const res = await api.post('/api/exam-campaigns', {
      title,
      description: desc,
      trackNames,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000)
    });
    await fetchCampaigns();
    if (res.data?.id) {
      setSelectedCampaignId(res.data.id);
      setActiveTab('STUDIO');
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
  const allAvailablePapers = currentTracks.flatMap(t => t.papers);

  return (
    <div className="space-y-6 select-none">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>{t('exams.headerBadge', 'AEGIS ENTERPRISE EXAM SUITE • ALDS v1.0')}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 tracking-tight">
            {t('exams.pageTitle', 'Quản Trị Chiến Dịch Khảo Thí & Kết Quả')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">
            {t('exams.pageSubtitle', 'Tạo đề tự động/thủ công, phân nhánh đối tượng, điều phối thí sinh và báo cáo kết quả toàn diện.')}
          </p>
        </div>

        {selectedCampaign && (
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-2xl">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold">
                {t('exams.selectedCampaign', 'Chiến dịch đang chọn')}
              </div>
              <div className="text-xs font-black text-white truncate max-w-[200px]">{selectedCampaign.title}</div>
            </div>
            <button
              onClick={() => fetchCampaigns()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ─── 4 MAIN TABS ─── */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'CAMPAIGNS'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Layers size={15} />
          <span>{t('exams.tabCampaigns', '1. CHIẾN DỊCH KHẢO THÍ')}</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDIO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'STUDIO'
              ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-slate-950 shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sliders size={15} />
          <span>{t('exams.tabStudio', '2. XƯỞNG ĐỀ THI (STUDIO)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'ROSTER'
              ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users size={15} />
          <span>{t('exams.tabRoster', '3. ĐIỀU PHỐI THÍ SINH (ROSTER)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('RESULTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'RESULTS'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Trophy size={15} />
          <span>{t('exams.tabResults', '4. KẾT QUẢ & PHỔ ĐIỂM')}</span>
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs font-mono">
          <Loader2 className="animate-spin text-cyan-400" size={24} />
          <span>{t('exams.syncing', 'Đang đồng bộ dữ liệu khảo thí...')}</span>
        </div>
      ) : (
        <>
          {activeTab === 'CAMPAIGNS' && (
            <CampaignListTab
              campaigns={campaigns}
              selectedCampaignId={selectedCampaignId}
              onSelectCampaign={(id) => {
                setSelectedCampaignId(id);
                setActiveTab('STUDIO');
              }}
              onCreateCampaign={handleCreateCampaign}
              loading={loading}
            />
          )}

          {activeTab === 'STUDIO' && selectedCampaignId && (
            <ExamStudioTab
              campaignId={selectedCampaignId}
              tracks={currentTracks}
              onRefresh={() => fetchCampaignDetail(selectedCampaignId)}
            />
          )}

          {activeTab === 'ROSTER' && selectedCampaignId && (
            <CandidateRosterTab
              campaignId={selectedCampaignId}
              availablePapers={allAvailablePapers}
            />
          )}

          {activeTab === 'RESULTS' && selectedCampaignId && (
            <ExamResultsTab campaignId={selectedCampaignId} />
          )}
        </>
      )}
    </div>
  );
}

export default AdminExamsPage;
