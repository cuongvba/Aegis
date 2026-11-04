import React from 'react';
import { Users, CreditCard, FileQuestion, BookOpen, Activity, Server, Database, ShieldCheck, Zap } from 'lucide-react';

export interface DashboardTelemetryData {
  totalLearners: number;
  newLearnersThisMonth: number;
  activeQuestions: number;
  newQuestionsThisMonth: number;
  totalNotebooks: number;
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyRevenueFormatted: string;
  activeExamSessions: number;
  totalAttempts: number;
  totalTenants: number;
  memoryUsageMb: number;
  cacheHitRatioPercent: number;
  serverTimeUtc: string;
  recentActivities: Array<{
    id: string;
    user: string;
    action: string;
    timeAgo: string;
    detail: string;
    category: string;
  }>;
  dailyTrends: Array<{
    date: string;
    attempts: number;
    questionsAdded: number;
  }>;
  revenueDistributions: Array<{
    provider: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

interface Props {
  data: DashboardTelemetryData;
}

export function AdminTelemetryCards({ data }: Props) {
  const cards = [
    {
      label: 'Người Dùng Thực Tế',
      value: data.totalLearners.toLocaleString('vi-VN'),
      subtext: `${data.totalTenants} tổ chức / trường học`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/5 border-blue-500/20',
      icon: <Users className="text-blue-400" size={20} />,
      badge: `${data.totalLearners} TK`,
    },
    {
      label: 'Doanh Thu Thực Tế',
      value: `${data.totalRevenue.toLocaleString('vi-VN')} đ`,
      subtext: `Tháng này: ${data.monthlyRevenueFormatted} đ`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5 border-emerald-500/20',
      icon: <CreditCard className="text-emerald-400" size={20} />,
      badge: 'VietQR / Stripe',
    },
    {
      label: 'Ngân Hàng Câu Hỏi',
      value: data.activeQuestions.toLocaleString('vi-VN'),
      subtext: `+${data.newQuestionsThisMonth} câu mới tháng này`,
      color: 'text-purple-400',
      bg: 'bg-purple-500/5 border-purple-500/20',
      icon: <FileQuestion className="text-purple-400" size={20} />,
      badge: 'CIG Verified',
    },
    {
      label: 'Giáo Trình PDF (AI RAG)',
      value: data.totalNotebooks.toLocaleString('vi-VN'),
      subtext: `${data.totalAttempts} lượt làm bài & nộp`,
      color: 'text-amber-400',
      bg: 'bg-amber-500/5 border-amber-500/20',
      icon: <BookOpen className="text-amber-400" size={20} />,
      badge: 'Bloom 5-6',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`p-5 rounded-2xl border ${c.bg} backdrop-blur-md shadow-sm relative overflow-hidden transition hover:scale-[1.01]`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{c.label}</span>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">{c.icon}</div>
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${c.color} tracking-tight`}>{c.value}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">{c.subtext}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                {c.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* SYSTEM HEALTH TELEMETRY PULSE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-slate-200">Trạng Thái Hệ Thống:</span>
          <span className="text-emerald-400 font-semibold">Vận Hành Tối Ưu (&lt;5ms)</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] font-mono">
          <span className="flex items-center gap-1.5">
            <Server size={13} className="text-cyan-400" /> RAM Tiến Trình: <strong className="text-white">{data.memoryUsageMb} MB</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" /> Cache Hit L1/L2: <strong className="text-white">{data.cacheHitRatioPercent}%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Database size={13} className="text-emerald-400" /> Lượt Thi &amp; Nộp: <strong className="text-white">{data.totalAttempts}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-purple-400" /> Phiên Live Arena: <strong className="text-white">{data.activeExamSessions}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
