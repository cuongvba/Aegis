import React, { useEffect, useRef, useState } from 'react';
import { Archive, Download, Eye, FileArchive, Lock, ShieldCheck, Upload, X } from 'lucide-react';
import {
  officeWorkspaceService,
  type ArchiveEntryInfo,
  type OfficeParsedDocument,
} from '@/services/officeWorkspace.service';

interface Props {
  open: boolean;
  initialArchiveFile?: File | null;
  onClose: () => void;
  onOpenParsedDoc: (doc: OfficeParsedDocument) => void;
}

export const Archive7zModal: React.FC<Props> = ({ open, initialArchiveFile, onClose, onOpenParsedDoc }) => {
  const packInputRef = useRef<HTMLInputElement | null>(null);
  const openInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<'PACK' | 'OPEN'>('OPEN');

  const [packFiles, setPackFiles] = useState<File[]>([]);
  const [archiveName, setArchiveName] = useState('tai_lieu_bao_mat');
  const [packPassword, setPackPassword] = useState('');

  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [openPassword, setOpenPassword] = useState('');
  const [entries, setEntries] = useState<ArchiveEntryInfo[]>([]);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inspectFile = async (file: File, pwd?: string) => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await officeWorkspaceService.inspectArchive(file, pwd);
      setRequiresPassword(res.requiresPassword);
      setEntries(res.entries || []);
      if (res.error) setErrorMsg(res.error);
      else setStatusMsg(`Đã đọc ${res.entries.length} tệp trong ${file.name} (Kiểm tra ATTT: An toàn).`);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { requiresPassword?: boolean; error?: string } } })?.response?.data;
      if (data?.requiresPassword) setRequiresPassword(true);
      setErrorMsg(data?.error || 'Tệp nén được bảo vệ bằng mật khẩu hoặc không thể đọc.');
      setEntries([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && initialArchiveFile) {
      setTab('OPEN');
      setArchiveFile(initialArchiveFile);
      setOpenPassword('');
      void inspectFile(initialArchiveFile);
    }
  }, [open, initialArchiveFile]);

  if (!open) return null;

  const handlePack = async () => {
    if (packFiles.length === 0) return;
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await officeWorkspaceService.pack7z(packFiles, archiveName, packPassword);
      setStatusMsg(
        packPassword.trim()
          ? 'Đã nén thành công tệp .7z với mã hóa AES-256 + ẩn danh sách tên tệp (-mhe=on).'
          : 'Đã nén thành công tệp .7z!',
      );
    } catch {
      setErrorMsg('Nén .7z thất bại. Vui lòng kiểm tra dung lượng (tối đa 100 MB).');
    } finally {
      setBusy(false);
    }
  };

  const handleReadDirect = async (entry: ArchiveEntryInfo) => {
    if (!archiveFile) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const parsed = await officeWorkspaceService.readArchiveEntry(archiveFile, entry.path, openPassword);
      onOpenParsedDoc(parsed);
      onClose();
    } catch {
      setErrorMsg(`Không thể mở đọc trực tiếp "${entry.name}". Hãy kiểm tra mật khẩu hoặc tải tệp về.`);
    } finally {
      setBusy(false);
    }
  };

  const handleExtractDownload = async (entry: ArchiveEntryInfo) => {
    if (!archiveFile) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await officeWorkspaceService.extractArchiveEntry(archiveFile, entry.path, entry.name, openPassword);
    } catch {
      setErrorMsg(`Giải nén "${entry.name}" thất bại. Hãy kiểm tra lại mật khẩu.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/75">
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-black">7z Vault — Nén / Giải Nén & Đọc Trực Tiếp Tài Liệu (.7z / .zip)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => { setTab('OPEN'); setErrorMsg(null); }}
            className={`px-4 py-2 rounded-t-xl text-xs font-black transition ${tab === 'OPEN' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          >
            Mở & Đọc Trực Tiếp (.7z / .zip)
          </button>
          <button
            onClick={() => { setTab('PACK'); setErrorMsg(null); }}
            className={`px-4 py-2 rounded-t-xl text-xs font-black transition ${tab === 'PACK' ? 'bg-slate-800 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
          >
            Nén Thành .7z Mã Hóa AES-256
          </button>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> ATTT: Chống Zip-Slip & Zip-Bomb • Không lưu vết trên Server
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {tab === 'OPEN' ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={openInputRef}
                  type="file"
                  accept=".7z,.zip,.tar,.gz"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setArchiveFile(f);
                      void inspectFile(f, openPassword);
                    }
                  }}
                />
                <button onClick={() => openInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-black text-white">
                  <Upload className="w-4 h-4" /> Chọn File .7z / .zip
                </button>
                <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={openPassword}
                    onChange={(e) => setOpenPassword(e.target.value)}
                    placeholder={requiresPassword ? 'Nhập mật khẩu để mở khóa archive...' : 'Mật khẩu (nếu tệp được đặt khóa)...'}
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                  />
                  {archiveFile && (
                    <button onClick={() => void inspectFile(archiveFile, openPassword)} disabled={busy} className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white">
                      Mở Khóa / Quét
                    </button>
                  )}
                </div>
              </div>

              {entries.length > 0 && (
                <div className="rounded-2xl border border-slate-800 divide-y divide-slate-800 bg-slate-950/60">
                  {entries.map((entry) => (
                    <div key={entry.path} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-200 truncate">{entry.path}</div>
                        <div className="text-[11px] text-slate-400">
                          {(entry.size / 1024).toFixed(1)} KB {entry.isEncrypted ? '• Mã hóa AES' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.canReadDirectly && (
                          <button
                            onClick={() => void handleReadDirect(entry)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-white"
                          >
                            <Eye className="w-3.5 h-3.5" /> Đọc Trực Tiếp
                          </button>
                        )}
                        <button
                          onClick={() => void handleExtractDownload(entry)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" /> Giải Nén
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input ref={packInputRef} type="file" multiple className="hidden" onChange={(e) => setPackFiles(Array.from(e.target.files || []))} />
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => packInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-white">
                  <Archive className="w-4 h-4" /> Chọn Các Tệp Cần Nén ({packFiles.length})
                </button>
                <input
                  value={archiveName}
                  onChange={(e) => setArchiveName(e.target.value)}
                  placeholder="Tên file .7z đầu ra..."
                  className="flex-1 min-w-[180px] rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                />
                <input
                  type="password"
                  value={packPassword}
                  onChange={(e) => setPackPassword(e.target.value)}
                  placeholder="Mật khẩu AES-256 + Ẩn tên tệp (tùy chọn)"
                  className="w-64 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                />
                <button
                  onClick={() => void handlePack()}
                  disabled={packFiles.length === 0 || busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 font-black text-white"
                >
                  <Download className="w-4 h-4" /> Nén & Tải .7z
                </button>
              </div>
              {packFiles.length > 0 && (
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-slate-300 space-y-1">
                  {packFiles.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex justify-between">
                      <span className="truncate">{f.name}</span>
                      <span className="text-slate-500">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {statusMsg && <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-2 text-emerald-300 font-semibold">{statusMsg}</div>}
          {errorMsg && <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 px-3 py-2 text-rose-300 font-semibold">{errorMsg}</div>}
        </div>
      </div>
    </div>
  );
};
