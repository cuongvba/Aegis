import React, { useEffect, useState } from 'react';
import { KeyRound, Server, ShieldCheck, Eye, Copy, Check, ExternalLink, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appVaultApi, type AppAccountSummary } from '@/components/vault/appVaultApi';
import { ismsApi } from '@/components/isms/ismsApi';

export const MobileItVaultPmcPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'VAULT' | 'PMC'>('VAULT');
  const [totpCode, setTotpCode] = useState('');
  const [accounts, setAccounts] = useState<AppAccountSummary[]>([]);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState('');
  const [notice, setNotice] = useState('');

  // Quick PMC Check-in state
  const [visitor, setVisitor] = useState('Cán bộ IT trực');
  const [purpose, setPurpose] = useState('Kiểm tra định kỳ Phòng Máy chủ');
  const [temp, setTemp] = useState('21°C / 50%');
  const [bringDevice, setBringDevice] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    appVaultApi.getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const unlock = async (id: string) => {
    setNotice('');
    try {
      const res = await appVaultApi.revealSecret(id, totpCode.trim());
      setRevealed((p) => ({ ...p, [id]: res.plainSecret }));
      setTotpCode('');
    } catch (e: any) {
      setNotice(e?.response?.data?.error ?? 'Cần mã 2FA 6 số hợp lệ.');
    }
  };

  const copyPw = (id: string, val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1800);
  };

  const checkInPmc = async () => {
    setBusy(true);
    setNotice('');
    try {
      const [t, h] = temp.split('/').map((s) => s.trim());
      const res = await ismsApi.triggerServerRoomVisit({
        visitorName: visitor,
        purpose,
        temperature: t || '21°C',
        humidity: h || '50%',
        bringDevice,
        deviceNameAndSerial: bringDevice ? deviceInfo : undefined,
        isMaintenance: false,
        totpCode: totpCode.trim() || undefined,
      });
      setNotice(`Đã ghi sổ liên hoàn: ${res.triggeredLedgers.join(' + ')}`);
    } catch (e: any) {
      setNotice(e?.response?.data?.error ?? 'Không thể Check-in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-2">
        <button onClick={() => navigate('/app-vault')} className="p-2 rounded-xl bg-slate-800 text-slate-300"><ArrowLeft className="w-4 h-4" /></button>
        <div className="text-center">
          <div className="text-xs font-black text-white">AEGIS IT MOBILE</div>
          <div className="text-[10px] text-emerald-400 font-bold">Két Mật Khẩu 2FA & Nhật Ký PMC</div>
        </div>
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
      </header>

      <div className="max-w-md mx-auto p-3 space-y-3">
        <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-3 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-emerald-300">Mã Authenticator 2FA:</span>
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            className="w-32 rounded-xl bg-slate-950 border border-emerald-500/40 px-2.5 py-1.5 text-center font-mono text-base font-black tracking-[0.25em] text-white"
          />
        </div>

        {notice && <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-200">{notice}</div>}

        {tab === 'VAULT' ? (
          <div className="space-y-2.5">
            {accounts.length === 0 && <div className="text-center py-8 text-xs text-slate-400">Chưa có tài khoản nào trong két. Hãy thêm tại /app-vault.</div>}
            {accounts.map((a) => (
              <div key={a.id} className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-sm text-white">[{a.appCode}] {a.appName}</div>
                  {a.appUri && <a href={a.appUri} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-slate-800 text-sky-400"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
                <div className="text-xs text-slate-300">TK: <strong className="text-white font-mono">{a.username}</strong> • Hạn MK: <span className="text-amber-300">{a.daysRemaining} ngày</span></div>
                {revealed[a.id] ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-emerald-300 truncate">{revealed[a.id]}</span>
                    <button onClick={() => copyPw(a.id, revealed[a.id])} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
                      {copiedId === a.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedId === a.id ? 'Đã chép' : 'Chép'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => void unlock(a.id)} className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2 text-xs font-black text-white">
                    <Eye className="w-3.5 h-3.5" /> Mở Khóa Xem Mật Khẩu (2FA)
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 text-xs">
            <div className="font-black text-sky-300 text-sm">Check-in Nhanh Phòng Máy Chủ (PMC-01)</div>
            <input value={visitor} onChange={(e) => setVisitor(e.target.value)} placeholder="Cán bộ vào phòng..." className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white" />
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Mục đích vào PMC..." className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white" />
            <input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="Nhiệt độ / Độ ẩm (21°C / 50%)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white" />
            <label className="flex items-center gap-2 font-bold text-amber-300">
              <input type="checkbox" checked={bringDevice} onChange={(e) => setBringDevice(e.target.checked)} />
              Mang thiết bị vào/ra (Auto sinh Mẫu 01/04)
            </label>
            {bringDevice && <input value={deviceInfo} onChange={(e) => setDeviceInfo(e.target.value)} placeholder="Tên thiết bị & Serial..." className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />}
            <button onClick={() => void checkInPmc()} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 py-3 font-black text-white disabled:opacity-50">
              <Sparkles className="w-4 h-4" /> {busy ? 'Đang ghi sổ...' : 'Check-in & Ghi Nhật Ký PMC'}
            </button>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-2 p-2 gap-2 max-w-md mx-auto">
        <button onClick={() => setTab('VAULT')} className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black ${tab === 'VAULT' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>
          <KeyRound className="w-4 h-4" /> Két Mật Khẩu
        </button>
        <button onClick={() => setTab('PMC')} className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black ${tab === 'PMC' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}>
          <Server className="w-4 h-4" /> Phòng Máy Chủ
        </button>
      </nav>
    </div>
  );
};
