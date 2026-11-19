import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Copy, CheckCircle2, X } from 'lucide-react';
import { dispatchWorkflowApi } from './dispatchWorkflowApi';

interface Props {
  open: boolean;
  enabled: boolean;
  onClose: () => void;
  onEnabled: () => void;
}

export const DispatchTotpModal: React.FC<Props> = ({ open, enabled, onClose, onEnabled }) => {
  const [setupData, setSetupData] = useState<{ secret: string; otpAuthUri: string; accountLabel: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleGenerate = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await dispatchWorkflowApi.setupTotp();
      setSetupData({ secret: res.secret, otpAuthUri: res.otpAuthUri, accountLabel: res.accountLabel });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể khởi tạo khóa Authenticator.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số từ ứng dụng Authenticator.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await dispatchWorkflowApi.verifyEnableTotp(code.trim());
      onEnabled();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Mã xác thực không hợp lệ.');
    } finally {
      setBusy(false);
    }
  };

  const copySecret = () => {
    if (!setupData) return;
    navigator.clipboard?.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold">Xác thực Authenticator (2FA - RFC 6238)</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-600">
          Áp dụng xác thực 2 lớp bằng <strong>Google Authenticator</strong> hoặc <strong>Microsoft Authenticator</strong> cho mọi công đoạn trình, duyệt, phân công, báo cáo và chấm điểm công văn.
        </p>

        {enabled && !setupData && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Đang bật bảo vệ 2FA cho tài khoản này. Bạn có thể tạo lại khóa nếu đổi thiết bị.
          </div>
        )}

        {!setupData ? (
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" /> {busy ? 'Đang tạo khóa...' : enabled ? 'Tạo lại khóa thiết lập (Reset Secret)' : 'Khởi tạo khóa Authenticator'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="mb-1 font-semibold text-slate-700">Bước 1: Nhập khóa thiết lập (Setup Key) vào Authenticator</div>
              <div className="text-[11px] text-slate-500">Tài khoản: <span className="font-mono text-slate-800">{setupData.accountLabel}</span></div>
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs font-bold tracking-wider text-indigo-700">
                <span className="truncate">{setupData.secret}</span>
                <button onClick={copySecret} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-sans text-slate-700 hover:bg-slate-200">
                  <Copy className="h-3 w-3" /> {copied ? 'Đã chép' : 'Chép'}
                </button>
              </div>
              <div className="mt-1.5 truncate text-[10px] text-slate-400" title={setupData.otpAuthUri}>URI: {setupData.otpAuthUri}</div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Bước 2: Nhập mã 6 số hiển thị trên ứng dụng</label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center font-mono text-base font-bold tracking-[0.35em] focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleVerify}
                  disabled={busy}
                  className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? 'Đang kiểm tra...' : 'Kích hoạt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</div>}
      </div>
    </div>
  );
};
