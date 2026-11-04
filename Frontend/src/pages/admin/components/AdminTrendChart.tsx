import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Layers } from 'lucide-react';

interface Props {
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

export function AdminTrendChart({ dailyTrends, revenueDistributions }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* CỘT CHÍNH (8/12): BIỂU ĐỒ BÓC TÁCH & KHẢO THÍ 7 NGÀY */}
      <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 backdrop-blur-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-cyan-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Xu Hướng Bóc Tách Câu Hỏi &amp; Lượt Khảo Thí (7 Ngày)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Câu hỏi nạp mới
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-400" /> Lượt làm bài
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              />
              <Area type="monotone" dataKey="questionsAdded" name="Câu hỏi nạp" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorQuestions)" />
              <Area type="monotone" dataKey="attempts" name="Lượt làm bài" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorAttempts)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CỘT PHỤ (4/12): CƠ CẤU DOANH THU & KÊNH THANH TOÁN */}
      <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 backdrop-blur-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Kênh Dòng Tiền &amp; Đối Soát
            </h3>
          </div>

          <div className="space-y-3">
            {revenueDistributions.length > 0 ? (
              revenueDistributions.map((rev) => (
                <div key={rev.provider} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">{rev.provider}</span>
                    <span className="text-emerald-400 font-mono">{rev.amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(5, rev.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>{rev.count} giao dịch thành công</span>
                    <span>{rev.percentage}% tỷ trọng</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-bold">
                Chưa có giao dịch phát sinh trong kỳ
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-tight">
          💡 <strong>Chuẩn FinOps:</strong> Dữ liệu thanh toán được đối soát theo thời gian thực 24/7 từ PayOS, VietQR Napas EMVCo và Stripe.
        </div>
      </div>
    </div>
  );
}

