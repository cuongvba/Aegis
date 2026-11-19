import React from 'react';
import { CalendarPlus, ArrowRight, User } from 'lucide-react';
import type { LedgerRowItem } from './smartLedgerRegistry';
import { buildGoogleCalendarDeepLink } from './googleCalendarSync';

interface Props {
  ledgerTitle: string;
  rows: LedgerRowItem[];
  statuses: string[];
  onChangeStatus: (rowId: string, nextStatus: string) => void;
}

export const LedgerKanbanBoard: React.FC<Props> = ({ ledgerTitle, rows, statuses, onChangeStatus }) => {
  const cols = statuses.length > 0 ? statuses : ['Chờ làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {cols.map((colStatus) => {
        const items = rows.filter((r) => (r.cells.status || cols[0]) === colStatus);
        return (
          <div key={colStatus} className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-200">{colStatus}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-sky-300">{items.length}</span>
            </div>

            {items.map((row) => {
              const title = row.cells.task || row.cells.deed || row.cells.member || row.cells.topic || 'Đầu việc';
              const assignee = row.cells.assignee || row.cells.member || row.cells.respondent;
              const date = row.cells.dueDate || row.cells.date;
              const nextStatus = cols[(cols.indexOf(colStatus) + 1) % cols.length];
              const gcalUrl = buildGoogleCalendarDeepLink({
                title: `[${ledgerTitle}] ${title}`,
                details: `Phụ trách: ${assignee || 'Nhóm'} | Trạng thái: ${colStatus}`,
                dateStr: date,
                assigneeEmail: row.cells.email,
              });

              return (
                <div key={row.id} className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-xs">
                  <div className="font-bold text-white leading-snug">{title}</div>
                  {assignee && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <User className="w-3 h-3 text-sky-400" /> {assignee} {date ? `• ${date}` : ''}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 text-[10px] font-bold"
                      title="Giao việc & đặt lịch trên Google Calendar"
                    >
                      <CalendarPlus className="w-3 h-3" /> Lịch Google
                    </a>
                    <button
                      type="button"
                      onClick={() => onChangeStatus(row.id, nextStatus)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-[10px] font-bold"
                    >
                      {nextStatus} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
