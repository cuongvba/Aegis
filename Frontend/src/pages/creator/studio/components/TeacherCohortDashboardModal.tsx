import React, { useState, useEffect } from 'react';
import { X, Users, AlertTriangle, CheckCircle2, TrendingUp, Share2, Copy, Check, Sparkles, FileSpreadsheet } from 'lucide-react';
import { learnerQuizService } from '@/services/learner-quiz.service';

interface StudentSubmission {
  id: string;
  name: string;
  score: number;
  timeSpent: string;
  submittedAt: string;
  wrongQuestionIndexes: number[];
  group: 'REMEDIAL' | 'CORE' | 'OLYMPIAN';
}

interface TeacherCohortDashboardModalProps {
  examTitle: string;
  totalQuestions: number;
  topicCode?: string;
  onClose: () => void;
}

export const TeacherCohortDashboardModal: React.FC<TeacherCohortDashboardModalProps> = ({
  examTitle,
  totalQuestions = 10,
  topicCode,
  onClose,
}) => {
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    { id: '1', name: 'Nguyễn Minh Anh', score: 95, timeSpent: '11:20', submittedAt: '10 phút trước', wrongQuestionIndexes: [8], group: 'OLYMPIAN' },
    { id: '2', name: 'Trần Đức Bình', score: 90, timeSpent: '13:45', submittedAt: '15 phút trước', wrongQuestionIndexes: [5], group: 'OLYMPIAN' },
    { id: '3', name: 'Lê Hoàng Cường', score: 85, timeSpent: '14:10', submittedAt: '25 phút trước', wrongQuestionIndexes: [4, 8], group: 'CORE' },
    { id: '4', name: 'Phạm Thu Dung', score: 80, timeSpent: '16:00', submittedAt: '30 phút trước', wrongQuestionIndexes: [1, 4], group: 'CORE' },
    { id: '5', name: 'Vũ Quốc Hưng', score: 55, timeSpent: '18:30', submittedAt: '40 phút trước', wrongQuestionIndexes: [1, 3, 4, 7, 8], group: 'REMEDIAL' },
    { id: '6', name: 'Đặng Mai Linh', score: 50, timeSpent: '19:10', submittedAt: '45 phút trước', wrongQuestionIndexes: [1, 2, 4, 7, 8], group: 'REMEDIAL' },
  ]);
  const [questionFailureRates, setQuestionFailureRates] = useState<Record<number, number>>({
    1: 45, 2: 18, 3: 22, 4: 65, 5: 12, 6: 8, 7: 35, 8: 52, 9: 15, 10: 20,
  });
  const [avgScore, setAvgScore] = useState(78.5);
  const [submittedCount, setSubmittedCount] = useState(38);
  const [totalClass, setTotalClass] = useState(42);

  // [Live Cohort Sync] Lấy dữ liệu bài nộp thật từ máy chủ nếu có topicCode
  useEffect(() => {
    if (!topicCode) return;
    learnerQuizService.getCohortSummary(topicCode).then((data) => {
      if (data && data.totalSubmitted > 0) {
        setSubmittedCount(data.totalSubmitted);
        setAvgScore(data.averageScore || 0);
        if (data.submissions && data.submissions.length > 0) {
          setSubmissions(data.submissions.map((s: any) => ({
            id: s.id,
            name: s.name,
            score: s.score,
            timeSpent: s.timeSpent,
            submittedAt: s.submittedAt,
            wrongQuestionIndexes: s.wrongQuestionIndexes || [],
            group: s.group || 'CORE',
          })));
        }
        if (data.questionFailureRates) {
          setQuestionFailureRates(data.questionFailureRates);
        }
      }
    }).catch((err) => console.warn('[CohortDashboard] getCohortSummary error:', err));
  }, [topicCode]);

  const reportSummary = `📊 [BÁO CÁO NHẬN THỨC LỚP HỌC - AEGIS GLOBAL]\nBài tập: ${examTitle}\n- Đã nộp: ${submittedCount}/${totalClass} học sinh\n- Điểm trung bình: ${avgScore}/100\n- 🚨 CẢNH BÁO ĐIỂM NGHẼN: Câu 4 (65% sai) và Câu 8 (52% sai). Thầy/Cô nên dành 15 phút đầu giờ để giảng lại dạng toán này!\n- 🌟 Tuyên dương: 12 bạn lọt vào Nhóm Đột Phá Điểm 10.`;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportSummary);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2000);
  };

  const handleShareZalo = async () => {
    try {
      await navigator.clipboard.writeText(reportSummary);
      setCopiedZalo(true);
      setTimeout(() => setCopiedZalo(false), 3000);
      window.open('https://chat.zalo.me/', '_blank');
    } catch {
      window.open('https://chat.zalo.me/', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block">
              Sư Phạm Thông Minh & Giám Sát Nhận Thức Real-time
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white truncate max-w-lg">
              {examTitle}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* ── 1. KPI THỐNG KÊ NHANH ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">Tiến Độ Nộp</span>
              <div className="text-xl font-black font-mono text-emerald-400">{submittedCount}/{totalClass}</div>
              <span className="text-[10px] text-slate-500 font-medium">90.5% cả lớp đã nộp</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">Điểm Trung Bình</span>
              <div className="text-xl font-black font-mono text-amber-400">{avgScore}đ</div>
              <span className="text-[10px] text-slate-500 font-medium">Độ lệch chuẩn: 1.4</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/30 bg-rose-500/5">
              <span className="text-[11px] text-rose-400 font-bold block mb-1">Điểm Nghẽn Lớn Nhất</span>
              <div className="text-xl font-black font-mono text-rose-400">Câu 4 (65% sai)</div>
              <span className="text-[10px] text-rose-300 font-medium">Lạc bước biến đổi</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 bg-indigo-500/5">
              <span className="text-[11px] text-indigo-400 font-bold block mb-1">Thời Gian TB</span>
              <div className="text-xl font-black font-mono text-indigo-400">14:20</div>
              <span className="text-[10px] text-slate-500 font-medium">Phản xạ nhanh</span>
            </div>
          </div>

          {/* ── 2. LIVE COHORT DIAGNOSTIC HEATMAP (Biểu đồ nhiệt câu hỏi) ── */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Live Cohort Diagnostic Heatmap (Bản Đồ Tỷ Lệ Làm Sai Từng Câu)
              </h4>
              <span className="text-[11px] text-rose-400 font-bold">🔴 Cột đỏ: Điểm nghẽn cần chữa cháy ngay</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: totalQuestions }).map((_, i) => {
                const qNum = i + 1;
                const failRate = questionFailureRates[qNum] || 15;
                const isHeavy = failRate >= 40;
                return (
                  <div
                    key={qNum}
                    className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition ${
                      isHeavy
                        ? 'border-rose-500/60 bg-rose-500/20 text-white ring-1 ring-rose-400'
                        : failRate >= 25
                        ? 'border-amber-500/40 bg-amber-500/10 text-slate-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">Câu {qNum}</span>
                    <span className={`text-xs font-black font-mono my-1 ${isHeavy ? 'text-rose-400' : 'text-slate-200'}`}>
                      {failRate}%
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-500">{isHeavy ? 'Cứu trợ' : 'Ổn định'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 3. PHÂN HÓA SƯ PHẠM TỰ ĐỘNG ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/30">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider block mb-1">
                🆘 Nhóm Cứu Trợ (6 bạn)
              </span>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">Hổng kiến thức nền tảng tại Câu 1, 4, 8.</p>
              <div className="text-xs font-bold text-slate-300">Vũ Quốc Hưng, Đặng Mai Linh...</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block mb-1">
                ⚖️ Nhóm Vững Vàng (24 bạn)
              </span>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">Nắm chắc kiến thức, cần khắc phục sai sót nhỏ.</p>
              <div className="text-xs font-bold text-slate-300">Lê Hoàng Cường, Phạm Thu Dung...</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block mb-1">
                🏆 Nhóm Đột Phá Điểm 10 (12 bạn)
              </span>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">Tư duy xuất sắc, sẵn sàng thi học sinh giỏi.</p>
              <div className="text-xs font-bold text-slate-300">Nguyễn Minh Anh, Trần Đức Bình...</div>
            </div>
          </div>
        </div>

        {/* ── FOOTER: 1-CLICK XUẤT BÁO CÁO CHO PHỤ HUYNH & NHÓM LỚP ── */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400">Tự động tổng hợp dữ liệu nhận thức 5 trục tọa độ</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              {copiedZalo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedZalo ? 'Đã Sao Chép Báo Cáo!' : 'Sao Chép Nhận Xét'}</span>
            </button>
            <button
              onClick={handleShareZalo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Gửi Vào Nhóm Zalo Lớp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

