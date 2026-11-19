import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Copy,
  Download,
  FileText,
  Home,
  Kanban,
  Plus,
  Sparkles,
  Table2,
  Trash2,
} from 'lucide-react';
import { officeWorkspaceService } from '@/services/officeWorkspace.service';
import { LedgerKanbanBoard } from '@/components/ledger/LedgerKanbanBoard';
import { buildGoogleCalendarDeepLink, downloadIcsCalendarFile } from '@/components/ledger/googleCalendarSync';
import {
  LEDGER_TEMPLATES,
  createLedgerFromTemplate,
  getLocalLedgers,
  pushLedgerToCloud,
  saveLocalLedger,
  syncLedgersFromCloud,
  type LedgerKind,
  type SmartLedgerDoc,
} from '@/components/ledger/smartLedgerRegistry';

export const SmartLedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<SmartLedgerDoc[]>(() => getLocalLedgers());
  const [activeId, setActiveId] = useState<string>(() => getLocalLedgers()[0]?.id || '');
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [newKind, setNewKind] = useState<LedgerKind>('WORK_KPI');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    syncLedgersFromCloud().then((merged) => {
      setLedgers(merged);
      if (merged.length > 0 && !merged.some((l) => l.id === activeId)) setActiveId(merged[0].id);
    });
  }, []);

  const active = ledgers.find((l) => l.id === activeId) || ledgers[0];

  const updateActive = (nextDoc: SmartLedgerDoc) => {
    const stamped = { ...nextDoc, updatedAt: new Date().toISOString() };
    setLedgers(saveLocalLedger(stamped));
    void pushLedgerToCloud(stamped);
  };

  const handleCreateNew = () => {
    const doc = createLedgerFromTemplate(newKind);
    setLedgers(saveLocalLedger(doc));
    setActiveId(doc.id);
    void pushLedgerToCloud(doc);
  };

  const handleCloneNextPeriod = () => {
    if (!active) return;
    const cloned: SmartLedgerDoc = {
      ...active,
      id: `ledger-${Date.now()}`,
      title: `${active.title} (Kỳ mới)`,
      rows: active.rows.map((r, i) => ({
        id: `row-${Date.now()}-${i}`,
        cells: { ...r.cells, status: active.columns.find((c) => c.key === 'status')?.options?.[0] || '' },
      })),
      updatedAt: new Date().toISOString(),
    };
    setLedgers(saveLocalLedger(cloned));
    setActiveId(cloned.id);
    void pushLedgerToCloud(cloned);
  };

  const handleAddRow = () => {
    if (!active) return;
    const blank: Record<string, string> = {};
    active.columns.forEach((c) => { blank[c.key] = c.options?.[0] || (c.type === 'date' ? new Date().toISOString().slice(0, 10) : ''); });
    updateActive({ ...active, rows: [...active.rows, { id: `row-${Date.now()}`, cells: blank }] });
  };

  const updateCell = (rowId: string, key: string, val: string) => {
    if (!active) return;
    updateActive({
      ...active,
      rows: active.rows.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [key]: val } } : r)),
    });
  };

  const runAiSummary = async () => {
    if (!active) return;
    setAiLoading(true);
    try {
      const sheetRows = [
        active.columns.map((c) => c.label),
        ...active.rows.map((r) => active.columns.map((c) => r.cells[c.key] || '')),
      ];
      const res = await officeWorkspaceService.runAiAssist({
        action: 'ANALYZE_SHEET',
        title: active.title,
        markdownContent: `Tổng hợp & đánh giá KPI cho: ${active.title}`,
        sheets: [{ name: active.title, rows: sheetRows }],
      });
      setAiReport(res.resultMarkdown);
    } finally {
      setAiLoading(false);
    }
  };

  const exportToXlsx = async () => {
    if (!active) return;
    const rows = [active.columns.map((c) => c.label), ...active.rows.map((r) => active.columns.map((c) => r.cells[c.key] || ''))];
    await officeWorkspaceService.downloadXlsx(active.title, [{ name: active.kind, rows }]);
  };

  const exportToOfficeDoc = () => {
    if (!active) return;
    const header = `| ${active.columns.map((c) => c.label).join(' | ')} |`;
    const sep = `| ${active.columns.map(() => '---').join(' | ')} |`;
    const body = active.rows.map((r) => `| ${active.columns.map((c) => (r.cells[c.key] || '-').replace(/\|/g, '/')).join(' | ')} |`).join('\n');
    const md = `# ${active.title}\n\n${header}\n${sep}\n${body}${aiReport ? `\n\n## Đánh giá AI\n\n${aiReport}` : ''}`;
    localStorage.setItem('aegis-office-studio-draft-v1', JSON.stringify({ docKind: 'DOCX', title: active.title, markdown: md, sheets: [] }));
    navigate('/office-studio');
  };

  const statusCol = active?.columns.find((c) => c.key === 'status');
  const doneCount = active?.rows.filter((r) => /Hoàn thành|Có mặt/i.test(r.cells.status || '')).length || 0;
  const totalCount = active?.rows.length || 0;
  const donePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <header className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold">
              <Home className="w-4 h-4 text-sky-400" /> Trang chính
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white">Aegis Smart Work, Ledger & Google Calendar OS</h1>
              <p className="text-[11px] text-slate-400">Quản lý Công việc Tập thể, Điểm danh, Thời khóa biểu, Việc tốt & Khảo sát (Cloud + Offline)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select value={newKind} onChange={(e) => setNewKind(e.target.value as LedgerKind)} className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 font-bold text-white">
              {Object.entries(LEDGER_TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
            <button onClick={handleCreateNew} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 font-black text-white">
              <Plus className="w-3.5 h-3.5" /> Tạo Sổ Mới
            </button>
            <button onClick={handleCloneNextPeriod} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 font-bold text-slate-200" title="Nhân bản danh sách cho tháng/tuần mới">
              <Copy className="w-3.5 h-3.5 text-amber-400" /> Kỳ Mới
            </button>
            <button onClick={() => void runAiSummary()} disabled={aiLoading} className="inline-flex items-center gap-1 rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-2 font-black text-white">
              <Sparkles className="w-3.5 h-3.5" /> {aiLoading ? 'Đang phân tích...' : 'AI Tổng Hợp KPI'}
            </button>
            <button onClick={() => void exportToXlsx()} className="inline-flex items-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-2 font-black text-white">
              <Download className="w-3.5 h-3.5" /> .XLSX
            </button>
            <button onClick={exportToOfficeDoc} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 font-black text-white">
              <FileText className="w-3.5 h-3.5" /> Office Studio
            </button>
          </div>
        </header>

        {/* Ledger Selector + Summary + View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {ledgers.map((l) => (
              <button
                key={l.id}
                onClick={() => { setActiveId(l.id); setAiReport(null); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${l.id === active?.id ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
              >
                {LEDGER_TEMPLATES[l.kind]?.emoji || '📄'} {l.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 font-black">
              Hoàn thành / Chuyên cần: {doneCount}/{totalCount} ({donePct}%)
            </span>
            {active && (
              <button onClick={() => downloadIcsCalendarFile(active.title, active.rows)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 font-bold" title="Xuất file .ics cho Google Calendar / Outlook">
                <Calendar className="w-3.5 h-3.5" /> Xuất .ICS
              </button>
            )}
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
              <button onClick={() => setViewMode('TABLE')} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${viewMode === 'TABLE' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}><Table2 className="w-3.5 h-3.5" /> Bảng</button>
              <button onClick={() => setViewMode('KANBAN')} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${viewMode === 'KANBAN' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}><Kanban className="w-3.5 h-3.5" /> Kanban</button>
            </div>
          </div>
        </div>

        {aiReport && (
          <div className="rounded-2xl bg-violet-950/40 border border-violet-500/40 p-4 text-xs text-violet-100 whitespace-pre-wrap">
            {aiReport}
          </div>
        )}

        {active && viewMode === 'KANBAN' ? (
          <LedgerKanbanBoard
            ledgerTitle={active.title}
            rows={active.rows}
            statuses={statusCol?.options || ['Chờ làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành']}
            onChangeStatus={(rowId, nextStatus) => updateCell(rowId, 'status', nextStatus)}
          />
        ) : active ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5 w-10">#</th>
                  {active.columns.map((c) => <th key={c.key} className="px-3 py-2.5 font-black">{c.label}</th>)}
                  <th className="px-3 py-2.5 text-right">Lịch Google / Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {active.rows.map((row, idx) => {
                  const gcalUrl = buildGoogleCalendarDeepLink({
                    title: `[${active.title}] ${row.cells.task || row.cells.deed || row.cells.member || 'Nhiệm vụ'}`,
                    details: `Phụ trách: ${row.cells.assignee || row.cells.member || 'Nhóm'}`,
                    dateStr: row.cells.dueDate || row.cells.date,
                    assigneeEmail: row.cells.email,
                  });
                  return (
                    <tr key={row.id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                      {active.columns.map((col) => (
                        <td key={col.key} className="px-2 py-1.5">
                          {col.type === 'status' && col.options ? (
                            <select value={row.cells[col.key] || col.options[0]} onChange={(e) => updateCell(row.id, col.key, e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-white font-semibold">
                              {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              type={col.type === 'date' ? 'date' : col.type === 'percent' || col.type === 'stars' ? 'number' : 'text'}
                              value={row.cells[col.key] || ''}
                              onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                              className="w-full rounded-lg bg-slate-950/70 border border-slate-800 focus:border-indigo-500 px-2 py-1 text-white"
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                        <a href={gcalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 text-sky-300 font-bold" title="Giao lịch lên Google Calendar">
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => updateActive({ ...active, rows: active.rows.filter((x) => x.id !== row.id) })} className="p-1 rounded-lg bg-rose-500/15 text-rose-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-3 border-t border-slate-800">
              <button onClick={handleAddRow} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-300">
                <Plus className="w-3.5 h-3.5" /> Thêm dòng mới
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SmartLedgerPage;
