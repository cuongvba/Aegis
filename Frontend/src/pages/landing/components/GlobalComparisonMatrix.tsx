import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle, Crown } from 'lucide-react';

interface MatrixRow {
  criterion: string;
  aegis: string;
  gameshowTools: string;
  traditionalLms: string;
  genericAi: string;
}

const DEFAULT_ROWS: MatrixRow[] = [
  {
    criterion: 'Bóc tách đề Word / MathType OLE (MTEF v5) & Ctrl+V Bảng/Toán → LaTeX/MD (<2ms)',
    aegis: 'Độc quyền giải mã nhị phân <2ms (Tiết kiệm 99% DB)',
    gameshowTools: 'Vỡ công thức hoặc biến thành ảnh mờ',
    traditionalLms: 'Phải nhập mã GIFT / XML thủ công',
    genericAi: 'Không có ngân hàng câu hỏi cấu trúc',
  },
  {
    criterion: 'Đa phương tiện cho Trẻ nhỏ (🎙️ Thu âm giọng cô, Video, 9 dạng đề GDPT 2025 & QR Zalo)',
    aegis: 'Thanh công cụ 1 chạm & Học sinh làm bài không cần tài khoản',
    gameshowTools: 'Giới hạn dạng câu hỏi, khóa tính năng trả phí cao',
    traditionalLms: 'Giao diện phức tạp, bắt buộc tạo tài khoản',
    genericAi: 'Không hỗ trợ giao bài & chấm điểm lớp học',
  },
  {
    criterion: 'Trí tuệ Nhân tạo Hàn lâm (Hội đồng Bầy sói WPSE + Đại Hội Thảo 6 Pha chống ảo giác)',
    aegis: 'Đồng thuận đa tác tử SCI = 98.4% & AegisNotebook đa nguồn',
    gameshowTools: 'Chỉ gọi 1 prompt LLM đơn giản dễ sai đáp án',
    traditionalLms: 'Không có AI biện chứng nội tại',
    genericAi: '1 mô hình đơn lẻ, dễ ảo giác (hallucination)',
  },
  {
    criterion: 'Đo lường Tâm trắc học Quốc tế (IRT 3-PL + CAT + Deep Knowledge Tracing + FSRS v5)',
    aegis: 'Chuẩn Khảo thí Quốc gia & Quốc tế (GMAT / GRE Standard)',
    gameshowTools: 'Chỉ đếm % câu đúng thô sơ',
    traditionalLms: 'Thống kê điểm tĩnh truyền thống',
    genericAi: 'Không có động cơ tâm trắc học IRT/DKT',
  },
  {
    criterion: 'Đấu trường Truyền hình Thời gian thực (<2ms RAM Buzzer, 6 Gameshow 60fps)',
    aegis: '6 Gameshow kinh điển (Olympia, Chiếc Nón Kỳ Diệu, Jeopardy!...)',
    gameshowTools: 'Chỉ có trắc nghiệm nhanh đơn điệu',
    traditionalLms: 'Không có Gameshow tương tác',
    genericAi: 'Không có phòng thi đấu thời gian thực',
  },
  {
    criterion: 'Kiến trúc Chủ quyền Kép (CDSA) & Bảo mật Cấp Ngân hàng (3-Layer RLS, SHA-256, PKI)',
    aegis: 'Cô lập dữ liệu 3 tầng, bảo vệ bản quyền Creator & Audit bất biến',
    gameshowTools: 'Thiếu phân quyền sâu cho Ngân hàng / Tập đoàn',
    traditionalLms: 'Cồng kềnh, tốn kém chi phí vận hành máy chủ riêng',
    genericAi: 'Rủi ro lộ lọt dữ liệu nội bộ doanh nghiệp',
  },
];

export const GlobalComparisonMatrix: React.FC = () => {
  const { t } = useTranslation('landing');
  const matrix = t('features.matrix', { returnObjects: true }) as any;
  const rows: MatrixRow[] = Array.isArray(matrix?.rows) && matrix.rows.length > 0 ? matrix.rows : DEFAULT_ROWS;

  return (
    <div className="mt-14 rounded-3xl border border-slate-800/90 bg-slate-900/50 backdrop-blur-xl p-5 sm:p-8">
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Crown size={12} /> {matrix?.badge || 'Global Category-King Benchmark'}
        </span>
        <h3 className="text-xl sm:text-3xl font-black text-white">
          {matrix?.title || '1 Hệ Sinh Thái Aegis Global = Thay Thế 5 Công Cụ Rời Rạc'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          {matrix?.subtitle ||
            'So sánh trực diện năng lực lõi của Aegis Global với các nền tảng Gameshow, LMS truyền thống và công cụ AI đơn lẻ trên thế giới.'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider">
              <th className="py-3.5 px-4 text-slate-400 w-[28%]">
                {matrix?.colCriterion || 'Tiêu chí Công nghệ & Sư phạm'}
              </th>
              <th className="py-3.5 px-4 bg-cyan-950/50 border-x border-t border-cyan-500/40 rounded-t-2xl text-cyan-300 w-[26%]">
                <div className="flex items-center gap-1.5">
                  <Crown size={14} className="text-amber-400" />
                  <span>{matrix?.colAegis || 'AEGIS GLOBAL (AGCI)'}</span>
                </div>
              </th>
              <th className="py-3.5 px-4 text-slate-400 w-[16%]">
                {matrix?.colGameshow || 'Kahoot! / Quizizz'}
              </th>
              <th className="py-3.5 px-4 text-slate-400 w-[15%]">
                {matrix?.colLms || 'Moodle / Canvas LMS'}
              </th>
              <th className="py-3.5 px-4 text-slate-400 w-[15%]">
                {matrix?.colAi || 'ChatGPT / NotebookLM'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {rows.map((r: any, i) => (
              <tr key={i} className="hover:bg-slate-800/25 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-200">{r.criterion || r.criteria}</td>
                <td className="py-3.5 px-4 bg-cyan-950/25 border-x border-cyan-500/30 font-semibold text-emerald-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{r.aegis}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-400">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{r.gameshowTools || r.kahoot}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-400">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{r.traditionalLms || r.lms}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  <div className="flex items-start gap-1.5">
                    <XCircle size={14} className="text-rose-400/80 shrink-0 mt-0.5" />
                    <span>{r.genericAi || r.ai}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GlobalComparisonMatrix;
