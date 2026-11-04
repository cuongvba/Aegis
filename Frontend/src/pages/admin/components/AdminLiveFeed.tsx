import React from 'react';
import { Clock, CreditCard, FileCheck, BookOpen, UserPlus, Sparkles } from 'lucide-react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timeAgo: string;
  detail: string;
  category: string;
}

interface Props {
  activities: ActivityItem[];
}

export function AdminLiveFeed({ activities }: Props) {
  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'PAYMENT':
        return {
          icon: <CreditCard size={14} className="text-emerald-400" />,
          pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        };
      case 'EXAM':
        return {
          icon: <FileCheck size={14} className="text-purple-400" />,
          pill: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        };
      case 'NOTEBOOK':
        return {
          icon: <BookOpen size={14} className="text-amber-400" />,
          pill: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        };
      case 'USER':
      default:
        return {
          icon: <UserPlus size={14} className="text-blue-400" />,
          pill: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        };
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
          <Clock size={20} className="text-blue-400" />
          <span>Nhật Ký Vận Hành Sống (Live Telemetry Feed)</span>
        </h2>
        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          Tự động đồng bộ từ PostgreSQL
        </span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {activities.map((act) => {
          const style = getBadgeStyle(act.category);
          return (
            <div
              key={act.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/20 px-2 rounded-xl transition"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span className={`p-2 rounded-xl border ${style.pill} shrink-0 mt-0.5 sm:mt-0`}>
                  {style.icon}
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-200">{act.user}</p>
                    <span className="text-[10px] font-mono text-slate-500">{act.timeAgo}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{act.action}</p>
                </div>
              </div>

              <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
                <span className="font-mono font-bold text-xs sm:text-sm text-cyan-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                  {act.detail}
                </span>
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 font-bold">
            Chưa có sự kiện nào được ghi nhận gần đây.
          </div>
        )}
      </div>
    </div>
  );
}

