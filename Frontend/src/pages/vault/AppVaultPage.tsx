import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, KeyRound, ShieldCheck, ExternalLink, Eye, EyeOff, CalendarPlus, Link2, Plus } from 'lucide-react';
import { appVaultApi, type AppAccountSummary, type AppCatalogItem } from '@/components/vault/appVaultApi';
import { DispatchTotpModal } from '@/components/dispatch/DispatchTotpModal';
import { dispatchWorkflowApi } from '@/components/dispatch/dispatchWorkflowApi';
import { buildGoogleCalendarDeepLink } from '@/components/ledger/googleCalendarSync';

export const AppVaultPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'ACCOUNTS' | 'CATALOG'>('ACCOUNTS');
  const [catalog, setCatalog] = useState<AppCatalogItem[]>([]);
  const [accounts, setAccounts] = useState<AppAccountSummary[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  // Account form
  const [appCode, setAppCode] = useState('AEGIS');
  const [username, setUsername] = useState('');
  const [plainSecret, setPlainSecret] = useState('');

  // Catalog form
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catUri, setCatUri] = useState('');
  const [catPolicy, setCatPolicy] = useState('Đổi mật khẩu mỗi 90 ngày, tối thiểu 12 ký tự, bắt buộc 2FA.');
  const [catDays, setCatDays] = useState(90);
  const [catRelated, setCatRelated] = useState('');

  const load = async () => {
    try {
      const [cats, accs, totp] = await Promise.all([
        appVaultApi.getCatalog(),
        appVaultApi.getAccounts(),
        dispatchWorkflowApi.getTotpStatus(),
      ]);
      setCatalog(cats);
      setAccounts(accs);
      setTotpEnabled(totp.enabled);
      if (cats.length > 0 && !cats.some((c) => c.code === appCode)) setAppCode(cats[0].code);
    } catch { /* ignore */ }
  };

  useEffect(() => { void load(); }, []);

  const saveAccount = async () => {
    if (!username.trim() || !plainSecret.trim()) return;
    await appVaultApi.saveAccount({ appCode, username, plainSecret });
    setUsername('');
    setPlainSecret('');
    setNotice('Đã mã hóa AES-256-GCM và lưu tài khoản vào Két bảo mật.');
    await load();
  };

  const reveal = async (id: string) => {
    setNotice('');
    try {
      const res = await appVaultApi.revealSecret(id, totpCode.trim());
      setRevealed((prev) => ({ ...prev, [id]: res.plainSecret }));
      setTotpCode('');
    } catch (e: any) {
      if (e?.response?.data?.requiresTotpSetup) setTotpModalOpen(true);
      setNotice(e?.response?.data?.error ?? 'Cần mã Authenticator (2FA) 6 số để giải mã.');
    }
  };

  const saveCatalog = async () => {
    if (!catCode.trim() || !catName.trim()) return;
    await appVaultApi.saveCatalog({
      code: catCode,
      name: catName,
      uri: catUri,
      governancePolicy: catPolicy,
      rotationDays: catDays,
      relatedAppCodes: catRelated.split(/[,;\s]+/).filter(Boolean),
    });
    setCatCode(''); setCatName(''); setCatUri(''); setCatRelated('');
    setNotice('Đã lưu Ứng dụng & Khung quy định vào Danh mục.');
    await load();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5">
      <div className="max-w-[1450px] mx-auto space-y-4">
        <header className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold">
              <Home className="w-4 h-4 text-sky-400" /> Trang chính
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" /> Két Tài Khoản, Vòng Đời Mật Khẩu & Danh Mục Ứng Dụng
              </h1>
              <p className="text-[11px] text-slate-400">Mã hóa AES-256-GCM • Bắt buộc TOTP 2FA khi xem mật khẩu • Cảnh báo đến hạn đổi MK & Hệ thống liên kết</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Mã 2FA mở khóa..."
              maxLength={6}
              className="w-36 rounded-xl bg-slate-950 border border-emerald-500/40 px-2.5 py-1.5 text-center font-mono font-bold tracking-widest text-white"
            />
            <button onClick={() => setTotpModalOpen(true)} className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 font-bold border ${totpEnabled ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300' : 'bg-amber-600/20 border-amber-500/40 text-amber-300'}`}>
              <ShieldCheck className="w-4 h-4" /> {totpEnabled ? '2FA: Đã bật' : 'Cài 2FA (Bắt buộc)'}
            </button>
            <button onClick={() => navigate('/m/it-ops')} className="px-3 py-2 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-300 font-bold">App Mobile (/m/it-ops)</button>
            <button onClick={() => navigate('/isms')} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold">ISMS 27001</button>
          </div>
        </header>

        {notice && <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-xs font-semibold text-amber-200">{notice}</div>}

        <div className="flex gap-2 text-xs">
          <button onClick={() => setTab('ACCOUNTS')} className={`px-4 py-2 rounded-xl font-black ${tab === 'ACCOUNTS' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            1. Két Tài Khoản & Hạn Đổi Mật Khẩu ({accounts.length})
          </button>
          <button onClick={() => setTab('CATALOG')} className={`px-4 py-2 rounded-xl font-black ${tab === 'CATALOG' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            2. Danh Mục Ứng Dụng & Quy Định ({catalog.length})
          </button>
        </div>

        {tab === 'ACCOUNTS' ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select value={appCode} onChange={(e) => setAppCode(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sky-300 font-bold">
                {catalog.map((c) => <option key={c.code} value={c.code}>[{c.code}] {c.name}</option>)}
              </select>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên đăng nhập / Email..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
              <input type="password" value={plainSecret} onChange={(e) => setPlainSecret(e.target.value)} placeholder="Mật khẩu (mã hóa AES-256-GCM)..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
              <button onClick={() => void saveAccount()} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-black text-white">
                <Plus className="w-4 h-4" /> Lưu & Mã Hóa Két
              </button>
            </div>

            {accounts.map((a) => (
              <div key={a.id} className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-white">[{a.appCode}] {a.appName}</span>
                    {a.appUri && <a href={a.appUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-400 hover:underline"><ExternalLink className="w-3 h-3" /> {a.appUri}</a>}
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${a.expiryStatus === 'EXPIRED' ? 'bg-rose-500/20 text-rose-300' : a.expiryStatus === 'EXPIRING_SOON' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {a.daysRemaining < 0 ? `Quá hạn ${Math.abs(a.daysRemaining)} ngày` : `Còn ${a.daysRemaining} ngày đổi MK (${a.nextRotationDate})`}
                    </span>
                  </div>
                  <div className="text-slate-300">Tài khoản: <span className="font-mono font-bold text-white">{a.username}</span> • Đổi gần nhất: {a.lastChangedAt}</div>
                  {a.relatedAppCodes?.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-violet-300"><Link2 className="w-3 h-3" /> Hệ thống liên quan: {a.relatedAppCodes.join(' ↔ ')}</div>
                  )}
                  {revealed[a.id] && (
                    <div className="mt-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 font-mono text-emerald-300">
                      Mật khẩu đã giải mã: <strong>{revealed[a.id]}</strong>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {revealed[a.id] ? (
                    <button onClick={() => setRevealed((p) => { const n = { ...p }; delete n[a.id]; return n; })} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 font-bold text-slate-200"><EyeOff className="w-3.5 h-3.5" /> Ẩn</button>
                  ) : (
                    <button onClick={() => void reveal(a.id)} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 font-black text-white"><Eye className="w-3.5 h-3.5" /> Mở Khóa Xem MK (2FA)</button>
                  )}
                  <a
                    href={buildGoogleCalendarDeepLink({ title: `[Đổi MK] ${a.appName} (${a.username})`, dateStr: a.nextRotationDate, details: `Chu kỳ ${a.rotationDays} ngày. Liên quan: ${a.relatedAppCodes.join(', ')}` })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-600/20 border border-sky-500/40 px-3 py-1.5 font-bold text-sky-300"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" /> Nhắc Lịch Google
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input value={catCode} onChange={(e) => setCatCode(e.target.value)} placeholder="Mã App (VD: IPCAS, AD, EMAIL)..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
              <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Tên Ứng dụng / Hệ thống..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
              <input value={catUri} onChange={(e) => setCatUri(e.target.value)} placeholder="URI truy cập (https://...)..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
              <input value={catPolicy} onChange={(e) => setCatPolicy(e.target.value)} placeholder="Khung quy định quản trị..." className="sm:col-span-2 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
              <div className="flex gap-2">
                <input type="number" value={catDays} onChange={(e) => setCatDays(Number(e.target.value))} className="w-24 rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-white" title="Chu kỳ đổi MK (ngày)" />
                <input value={catRelated} onChange={(e) => setCatRelated(e.target.value)} placeholder="Liên quan (AD, VPN)..." className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
              </div>
            </div>
            <button onClick={() => void saveCatalog()} className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 font-black text-white">Lưu Danh Mục Ứng Dụng</button>
            {catalog.map((c) => (
              <div key={c.id} className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                <div className="font-black text-white">[{c.code}] {c.name} <span className="text-sky-400 font-normal">• {c.uri}</span></div>
                <div className="text-slate-400">Quy định ({c.rotationDays} ngày/lần): {c.governancePolicy}</div>
                {c.relatedAppCodes?.length > 0 && <div className="text-[11px] text-violet-300">Liên kết phụ thuộc: {c.relatedAppCodes.join(' ↔ ')}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <DispatchTotpModal open={totpModalOpen} enabled={totpEnabled} onClose={() => setTotpModalOpen(false)} onEnabled={() => setTotpEnabled(true)} />
    </div>
  );
};

export default AppVaultPage;
