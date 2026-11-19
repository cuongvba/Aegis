import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CalendarPlus,
  CheckCircle2,
  FilePlus2,
  FileText,
  Home,
  Lock,
  Send,
  Upload,
  UserCheck,
} from 'lucide-react';
import { dispatchWorkflowApi, type OfficialDispatchItem } from '@/components/dispatch/dispatchWorkflowApi';
import { buildGoogleCalendarDeepLink } from '@/components/ledger/googleCalendarSync';

const STATUS_BADGE: Record<string, string> = {
  RECEIVED_DRAFT: 'bg-slate-800 text-slate-300',
  SUBMITTED_TRIAGE: 'bg-amber-500/20 text-amber-300',
  ASSIGNED: 'bg-sky-500/20 text-sky-300',
  IN_PROGRESS: 'bg-indigo-500/20 text-indigo-300',
  REPORTED_REVIEW: 'bg-purple-500/20 text-purple-300',
  EVALUATED_LOCKED: 'bg-emerald-500/20 text-emerald-300',
};

export const OfficialDispatchPage: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<OfficialDispatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // New Dispatch Draft
  const [dispatchNumber, setDispatchNumber] = useState('128/CV-AEGIS');
  const [urgency, setUrgency] = useState<'THUONG' | 'KHAN' | 'HOA_TOC'>('THUONG');
  const [title, setTitle] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [busy, setBusy] = useState(false);

  // Workflow step inputs
  const [directive, setDirective] = useState('');
  const [assignee, setAssignee] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-28');
  const [progress, setProgress] = useState(50);
  const [reportText, setReportText] = useState('');
  const [stars, setStars] = useState(5);

  const loadList = async () => {
    try {
      const data = await dispatchWorkflowApi.list();
      setItems(data);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch { /* ignore */ }
  };

  useEffect(() => { void loadList(); }, []);

  const active = items.find((i) => i.id === activeId) || null;

  useEffect(() => {
    if (!active) return;
    setDirective(active.executiveDirective || '');
    setAssignee(active.leadAssignee || '');
    setAssigneeEmail(active.leadAssigneeEmail || '');
    setDueDate(active.dueDate || '2026-11-28');
    setProgress(active.progressPercent || 0);
    setReportText(active.resultReport || '');
    setStars(active.qualityStars || 5);
  }, [activeId, items]);

  const handleOcrFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const ext = await dispatchWorkflowApi.ocrExtract(file);
      setDispatchNumber(ext.dispatchNumber);
      setUrgency(ext.urgency);
      setTitle(ext.title);
      setContentMarkdown(ext.contentMarkdown);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const created = await dispatchWorkflowApi.upsert({
        dispatchNumber,
        direction: 'INCOMING',
        urgency,
        title: title.trim(),
        contentMarkdown,
        status: 'RECEIVED_DRAFT',
      });
      setTitle('');
      setContentMarkdown('');
      await loadList();
      setActiveId(created.id);
    } finally {
      setBusy(false);
    }
  };

  const runTransition = async (targetStatus: string) => {
    if (!active) return;
    setBusy(true);
    try {
      const updated = await dispatchWorkflowApi.transition(active.id, {
        targetStatus,
        executiveDirective: directive,
        leadAssignee: assignee,
        leadAssigneeEmail: assigneeEmail,
        dueDate,
        progressPercent: progress,
        resultReport: reportText,
        qualityStars: stars,
      });
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } finally {
      setBusy(false);
    }
  };

  const filtered = filterStatus === 'ALL' ? items : items.filter((i) => i.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <header className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold">
              <Home className="w-4 h-4 text-sky-400" /> Trang chính
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white">Aegis E-Office — Luồng Xử Lý Công Văn, Giao Việc & Chấm Điểm KPI</h1>
              <p className="text-[11px] text-slate-400">Nhập OCR $\rightarrow$ Trình xử lý $\rightarrow$ Lãnh đạo Bút phê $\rightarrow$ Phân công (/work-ledger) $\rightarrow$ Báo cáo $\rightarrow$ Chấm điểm</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <button onClick={() => navigate('/work-ledger')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold">Mở Sổ Việc (/work-ledger)</button>
            <button onClick={() => navigate('/office-studio')} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold">Office Studio</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Intake OCR + Dispatch List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sky-300 flex items-center gap-1.5"><FilePlus2 className="w-4 h-4" /> Nhập Công Văn Mới (OCR)</span>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => void handleOcrFile(e.target.files?.[0])} />
                <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold">
                  <Upload className="w-3.5 h-3.5" /> Quét OCR File
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={dispatchNumber} onChange={(e) => setDispatchNumber(e.target.value)} placeholder="Số hiệu..." className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-bold" />
                <select value={urgency} onChange={(e) => setUrgency(e.target.value as typeof urgency)} className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-bold">
                  <option value="THUONG">Độ khẩn: Thường</option>
                  <option value="KHAN">Khẩn</option>
                  <option value="HOA_TOC">Hỏa tốc</option>
                </select>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trích yếu nội dung công văn..." className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 font-bold" />
              <textarea rows={2} value={contentMarkdown} onChange={(e) => setContentMarkdown(e.target.value)} placeholder="Nội dung bóc tách..." className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2" />
              <button onClick={() => void handleCreate()} disabled={busy || !title.trim()} className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-black text-white">
                + Tạo Hồ Sơ Công Văn
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 space-y-2 text-xs">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-bold">
                <option value="ALL">Tất cả hồ sơ ({items.length})</option>
                <option value="RECEIVED_DRAFT">1. Văn thư Nháp</option>
                <option value="SUBMITTED_TRIAGE">2. Chờ Lãnh đạo Bút phê</option>
                <option value="ASSIGNED">3. Đã Phân công</option>
                <option value="IN_PROGRESS">4. Đang Xử lý</option>
                <option value="REPORTED_REVIEW">5. Chờ Đánh giá & Chấm điểm</option>
                <option value="EVALUATED_LOCKED">6. Đã Hoàn thành & Khóa</option>
              </select>
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                {filtered.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`w-full text-left rounded-xl border p-2.5 transition ${d.id === active?.id ? 'border-sky-500 bg-sky-500/10' : 'border-slate-800 bg-slate-950/60'}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-sky-300">{d.dispatchNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[d.status] || 'bg-slate-800'}`}>{d.status}</span>
                    </div>
                    <div className="font-bold text-white truncate mt-1">{d.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: 7-Step Workflow Execution */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 text-xs">
            {!active ? (
              <div className="h-64 flex items-center justify-center text-slate-500 font-semibold">Chọn hoặc tạo mới 1 hồ sơ công văn bên trái để bắt đầu luồng xử lý.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-[11px] font-black text-sky-400">{active.dispatchNumber} • {active.urgency}</div>
                    <h2 className="text-base font-black text-white">{active.title}</h2>
                  </div>
                  {active.status === 'EVALUATED_LOCKED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-black">
                      <Lock className="w-4 h-4" /> Đã Chốt Điểm: {active.finalScore}/100 (SLA: {active.slaScore})
                    </span>
                  )}
                </div>

                {/* Step 2: Submit */}
                {active.status === 'RECEIVED_DRAFT' && (
                  <button onClick={() => void runTransition('SUBMITTED_TRIAGE')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-black">
                    <Send className="w-4 h-4" /> Trình Lãnh Đạo Đầu Mối Xử Lý
                  </button>
                )}

                {/* Step 3-4: Executive Directive & Delegation */}
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-2.5">
                  <div className="font-black text-amber-300 flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> Lãnh Đạo Đầu Mối: Bút Phê & Phân Công</div>
                  <input value={directive} onChange={(e) => setDirective(e.target.value)} placeholder="Bút phê chỉ đạo..." className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Người/Đơn vị chủ trì..." className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white" />
                    <input value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} placeholder="Email nhận Lịch Google..." className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white" />
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void runTransition('ASSIGNED')} disabled={active.status === 'EVALUATED_LOCKED'} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 font-black text-white">
                      Phê Duyệt Phân Công (Đồng bộ /work-ledger)
                    </button>
                    <a
                      href={buildGoogleCalendarDeepLink({ title: `[CV ${active.dispatchNumber}] ${active.title}`, details: directive, dateStr: dueDate, assigneeEmail })}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 text-sky-300 font-bold"
                    >
                      <CalendarPlus className="w-4 h-4" /> Giao Lịch Google
                    </a>
                  </div>
                </div>

                {/* Step 5: Progress & Report */}
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-300">Cán Bộ Thực Hiện: Báo Cáo Tiến Độ ({progress}%)</span>
                    <button
                      onClick={() => {
                        localStorage.setItem('aegis-office-studio-draft-v1', JSON.stringify({ docKind: 'DOCX', title: `Báo cáo CV ${active.dispatchNumber}`, markdown: `# Báo cáo xử lý ${active.dispatchNumber}\n\n${reportText}`, sheets: [] }));
                        navigate('/office-studio');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/25 text-indigo-300 font-bold"
                    >
                      <FileText className="w-3.5 h-3.5" /> Soạn Văn Bản Trả Lời (/office-studio)
                    </button>
                  </div>
                  <input type="range" min={0} max={100} step={10} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-indigo-500" />
                  <textarea rows={2} value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Tóm tắt kết quả xử lý..." className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white" />
                  <button onClick={() => void runTransition('REPORTED_REVIEW')} disabled={active.status === 'EVALUATED_LOCKED'} className="px-4 py-2 rounded-xl bg-indigo-600 disabled:opacity-40 font-black text-white">
                    Nộp Báo Cáo Kết Quả Chờ Đánh Giá
                  </button>
                </div>

                {/* Step 6-7: Evaluate & Score */}
                <div className="rounded-2xl bg-emerald-950/25 border border-emerald-500/40 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="font-black text-emerald-200">Đánh giá & Chấm điểm (1–5 ⭐):</span>
                    <select value={stars} onChange={(e) => setStars(Number(e.target.value))} className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 font-bold text-amber-300">
                      {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} ⭐ ({s * 20}đ chất lượng)</option>)}
                    </select>
                  </div>
                  <button onClick={() => void runTransition('EVALUATED_LOCKED')} disabled={active.status === 'EVALUATED_LOCKED'} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-black text-white">
                    <CheckCircle2 className="w-4 h-4" /> Nghiệm Thu & Chốt Điểm Bất Biến
                  </button>
                </div>

                {active.auditHistory?.length > 0 && (
                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    <div className="font-bold text-slate-300">Vết kiểm toán luồng xử lý:</div>
                    {active.auditHistory.map((h, i) => <div key={i}>• {h}</div>)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialDispatchPage;
