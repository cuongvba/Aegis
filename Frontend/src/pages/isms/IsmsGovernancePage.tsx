import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ShieldCheck, Sparkles, Lock, CheckCircle2, Plus } from 'lucide-react';
import { ismsApi, type IsmsOverviewResponse } from '@/components/isms/ismsApi';
import { IsmsOverviewCards } from '@/components/isms/IsmsOverviewCards';

type TabKey = 'SOA' | 'ASSETS' | 'RISKS' | 'INCIDENTS';

export const IsmsGovernancePage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IsmsOverviewResponse | null>(null);
  const [tab, setTab] = useState<TabKey>('SOA');
  const [soaTheme, setSoaTheme] = useState('ALL');
  const [soaQuery, setSoaQuery] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [notice, setNotice] = useState('');

  // Quick form states
  const [assetName, setAssetName] = useState('');
  const [assetClass, setAssetClass] = useState('CONFIDENTIAL');
  const [riskTitle, setRiskTitle] = useState('');
  const [likelihood, setLikelihood] = useState(4);
  const [impact, setImpact] = useState(4);
  const [incTitle, setIncTitle] = useState('');
  const [incDesc, setIncDesc] = useState('');

  const load = async () => {
    try {
      setData(await ismsApi.getOverview());
    } catch { /* ignore */ }
  };

  useEffect(() => { void load(); }, []);

  const handleExport = async () => {
    const res = await ismsApi.exportAudit();
    const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aegis-ISO27001-Audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`Đã xuất Hồ sơ Audit (SHA-256: ${String(res.sha256Seal).slice(0, 16)}...)`);
  };

  const addAsset = async () => {
    if (!assetName.trim()) return;
    await ismsApi.saveAsset({ name: assetName.trim(), classification: assetClass, category: 'DATA', owner: 'CISO / CNTT' });
    setAssetName('');
    await load();
  };

  const addRisk = async () => {
    if (!riskTitle.trim()) return;
    const saved = await ismsApi.saveRisk({ title: riskTitle.trim(), likelihood, impact, controlEffectiveness: 0.5, treatmentOwner: 'Phòng CNTT & ATTT' });
    setRiskTitle('');
    setNotice(saved.requiresRtp ? `Rủi ro ${saved.riskLevel} (${saved.rawScore}/25) — Đã tự động tạo RTP & đồng bộ /work-ledger!` : 'Đã lưu hồ sơ rủi ro.');
    await load();
  };

  const approveRisk = async (id: string) => {
    try {
      await ismsApi.approveRisk(id, totpCode.trim() || undefined);
      setTotpCode('');
      setNotice('Đã phê duyệt chấp nhận/đóng rủi ro (SHA-256 Sealed).');
      await load();
    } catch (e: any) {
      setNotice(e?.response?.data?.error ?? 'Cần mã Authenticator (2FA) hợp lệ.');
    }
  };

  const addIncident = async () => {
    if (!incTitle.trim()) return;
    const saved = await ismsApi.saveIncident({ title: incTitle.trim(), description: incDesc.trim(), assignee: 'Đội Ứng cứu Sự cố' });
    setIncTitle('');
    setIncDesc('');
    setNotice(`AI Copilot đã ánh xạ: ${saved.mappedControls?.join(', ')} & đẩy CAPA sang /work-ledger!`);
    await load();
  };

  const closeIncident = async (id: string) => {
    try {
      await ismsApi.closeIncident(id, totpCode.trim() || undefined);
      setTotpCode('');
      setNotice('Đã nghiệm thu & đóng sự cố CAPA (SHA-256 Sealed).');
      await load();
    } catch (e: any) {
      setNotice(e?.response?.data?.error ?? 'Cần mã Authenticator (2FA) hợp lệ.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5">
      <div className="max-w-[1550px] mx-auto space-y-4">
        <header className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold">
              <Home className="w-4 h-4 text-sky-400" /> Trang chính
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Aegis ISMS Governance OS — ISO/IEC 27001:2022
              </h1>
              <p className="text-[11px] text-slate-400">Live Auto-Evidence • Ma trận Rủi ro 5x5 • AI Copilot CAPA • Phê duyệt TOTP 2FA & SHA-256</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Mã 2FA (nếu duyệt)..."
              maxLength={6}
              className="w-40 rounded-xl bg-slate-950 border border-emerald-500/40 px-2.5 py-1.5 text-center font-mono font-bold tracking-widest text-white"
            />
            <button onClick={() => navigate('/mission-hub')} className="px-3 py-2 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 font-bold">Mission Hub</button>
            <button onClick={async () => { const r = await ismsApi.publishPolicy(); setNotice(r.message); await load(); }} className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold">Ban hành Chính sách (A.5.1)</button>
            <button onClick={() => navigate('/dispatches')} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold">Công văn (/dispatches)</button>
            <button onClick={() => navigate('/work-ledger')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold">Sổ Việc (/work-ledger)</button>
          </div>
        </header>

        {notice && <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-xs font-semibold text-indigo-200">{notice}</div>}

        {data && <IsmsOverviewCards data={data} onExport={handleExport} />}

        <div className="flex flex-wrap gap-2 text-xs">
          {([
            ['SOA', 'Bảng SoA & Auto-Evidence (ISO 27001:2022)'],
            ['ASSETS', 'Sổ Tài sản Thông tin'],
            ['RISKS', 'Đánh giá Rủi ro 5x5 & RTP'],
            ['INCIDENTS', 'Sự cố & CAPA (AI Copilot)'],
          ] as [TabKey, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3.5 py-2 rounded-xl font-black ${tab === k ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-xs space-y-3">
          {tab === 'SOA' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'A.5', 'A.6', 'A.7', 'A.8'].map((t) => (
                  <button key={t} onClick={() => setSoaTheme(t)} className={`px-2.5 py-1 rounded-lg font-bold ${soaTheme === t ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400'}`}>
                    {t === 'ALL' ? `Tất cả (${data?.controls.length ?? 93})` : t}
                  </button>
                ))}
              </div>
              <input value={soaQuery} onChange={(e) => setSoaQuery(e.target.value)} placeholder="Tìm control (VD: A.8.5, backup, privacy)..." className="w-64 rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-white" />
            </div>
          )}
          {tab === 'SOA' && data?.controls
            .filter((c) => (soaTheme === 'ALL' || c.theme.startsWith(soaTheme)) && (!soaQuery.trim() || `${c.controlId} ${c.title} ${c.evidenceSource}`.toLowerCase().includes(soaQuery.toLowerCase())))
            .map((c) => (
            <div key={c.controlId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5">
              <div>
                <div className="font-black text-white">{c.controlId} — {c.title}</div>
                <div className="text-[11px] text-slate-400">{c.theme} • Bằng chứng: <span className="text-sky-300">{c.evidenceSource}</span></div>
              </div>
              <div className="flex items-center gap-2">
                {c.autoEvidence && <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Auto-Evidence</span>}
                <select
                  value={c.status}
                  onChange={async (e) => { await ismsApi.toggleSoa({ controlId: c.controlId, status: e.target.value, applicable: c.applicable, evidenceSource: c.evidenceSource }); await load(); }}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 font-bold text-slate-200"
                >
                  <option value="VERIFIED_AUTO">VERIFIED_AUTO</option>
                  <option value="IMPLEMENTED">IMPLEMENTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PLANNED">PLANNED</option>
                </select>
              </div>
            </div>
          ))}

          {tab === 'ASSETS' && (
            <>
              <div className="flex flex-wrap gap-2">
                <input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Tên tài sản (VD: CSDL Hồ sơ Học viên, API Keys...)" className="flex-1 min-w-[220px] rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
                <select value={assetClass} onChange={(e) => setAssetClass(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-amber-300 font-bold">
                  <option value="PUBLIC">PUBLIC (Công khai)</option>
                  <option value="INTERNAL">INTERNAL (Nội bộ)</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL (Mật)</option>
                  <option value="RESTRICTED">RESTRICTED (Tuyệt mật)</option>
                </select>
                <button onClick={() => void addAsset()} className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-4 py-2 font-black text-white"><Plus className="w-4 h-4" /> Thêm Tài sản</button>
              </div>
              {data?.assets.map((a) => (
                <div key={a.id} className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 flex justify-between">
                  <span className="font-bold text-white">{a.name}</span>
                  <span className="text-amber-300 font-black">{a.classification}</span>
                </div>
              ))}
            </>
          )}

          {tab === 'RISKS' && (
            <>
              <div className="flex flex-wrap gap-2">
                <input value={riskTitle} onChange={(e) => setRiskTitle(e.target.value)} placeholder="Mô tả rủi ro ATTT (VD: Rò rỉ token truy cập)..." className="flex-1 min-w-[220px] rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
                <select value={likelihood} onChange={(e) => setLikelihood(Number(e.target.value))} className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-white">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Khả năng: {n}</option>)}
                </select>
                <select value={impact} onChange={(e) => setImpact(Number(e.target.value))} className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-white">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Tác động: {n}</option>)}
                </select>
                <button onClick={() => void addRisk()} className="rounded-xl bg-amber-600 px-4 py-2 font-black text-white">Đánh giá & Auto-RTP</button>
              </div>
              {data?.risks.map((r) => (
                <div key={r.id} className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-white">{r.title}</div>
                    <div className="text-[11px] text-slate-400">Raw: {r.rawScore}/25 ({r.riskLevel}) • Residual: {r.residualScore} • Hạn RTP: {r.dueDate}</div>
                  </div>
                  {r.status === 'APPROVED_LOCKED'
                    ? <span className="inline-flex items-center gap-1 text-emerald-300 font-black"><Lock className="w-3.5 h-3.5" /> Đã duyệt (SHA-256)</span>
                    : <button onClick={() => void approveRisk(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-black text-white">Duyệt 2FA</button>}
                </div>
              ))}
            </>
          )}

          {tab === 'INCIDENTS' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={incTitle} onChange={(e) => setIncTitle(e.target.value)} placeholder="Tiêu đề sự cố (VD: Phishing email nhân sự)..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
                <input value={incDesc} onChange={(e) => setIncDesc(e.target.value)} placeholder="Chi tiết để AI ánh xạ ISO 27001..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
                <button onClick={() => void addIncident()} className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-600 px-4 py-2 font-black text-white"><Sparkles className="w-4 h-4" /> Ghi nhận & AI CAPA</button>
              </div>
              {data?.incidents.map((inc) => (
                <div key={inc.id} className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-white">{inc.title} <span className="text-rose-300">[{inc.severity}]</span></div>
                    <div className="text-[11px] text-sky-300">ISO Controls: {inc.mappedControls.join(' • ')}</div>
                    <div className="text-[11px] text-slate-400">{inc.containmentAction}</div>
                  </div>
                  {inc.status === 'CLOSED_VERIFIED'
                    ? <span className="inline-flex items-center gap-1 text-emerald-300 font-black"><CheckCircle2 className="w-3.5 h-3.5" /> Đã đóng CAPA</span>
                    : <button onClick={() => void closeIncident(inc.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-black text-white">Đóng CAPA (2FA)</button>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IsmsGovernancePage;
