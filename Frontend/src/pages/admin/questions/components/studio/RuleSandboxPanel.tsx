import React from 'react';
import { 
  Sliders, 
  Play, 
  Bot, 
  BrainCircuit, 
  Check, 
  Zap, 
  Sparkles, 
  ShieldAlert, 
  FileCode, 
  Terminal,
  HelpCircle
} from 'lucide-react';
import { 
  QuestionParsingRule, 
  ParseSnippetResponse, 
  AiRuleAutopilotResponse 
} from '@/services/parsing-rules.service';

interface RuleSandboxPanelProps {
  rules: QuestionParsingRule[];
  snippetText: string;
  setSnippetText: (val: string) => void;
  examHint: string;
  setExamHint: (val: string) => void;
  selectedRuleCode: string;
  setSelectedRuleCode: (val: string) => void;
  isParsing: boolean;
  isAiGenerating: boolean;
  isSavingRule: boolean;
  parseResult: ParseSnippetResponse | null;
  aiAutopilotResult: AiRuleAutopilotResponse | null;
  onRunTest: () => void;
  onAiAutopilot: () => void;
  onSaveCustomRule: () => void;
}

export const PRESET_SNIPPETS = {
  R_GEN_DIRECTIVE_TEST: `PHẦN II: CÂU HỎI ĐÚNG HOẶC SAI
Thí sinh trả lời từ câu 1 đến câu 2. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
Câu 1. Cho hàm số y = f(x) có đạo hàm liên tục trên R.
a) Hàm số đồng biến trên khoảng (0; 2).
b) Đồ thị hàm số có đúng 2 điểm cực trị.
c) Giá trị lớn nhất của hàm số bằng 5.
d) Phương trình f(x) = 0 có đúng 3 nghiệm thực.
ĐÁP ÁN: a:Đ, b:S, c:Đ, d:S
Lời giải: Khảo sát sự biến thiên của hàm số trên bảng biến thiên.

PHẦN III: CÂU HỎI TRẢ LỜI NGẮN
Thí sinh viết câu trả lời vào phiếu trả lời.
Câu 2. Cho tứ diện ABCD có thể tích bằng 12. Tính thể tích khối tứ diện đều có cùng độ dài cạnh.
ĐÁP ÁN: 8.5
Lời giải: Sử dụng công thức tính tỷ số thể tích tứ diện.`,

  VN_STANDARD: `Câu 1. Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?
A. Thành phố Hồ Chí Minh
B. Hà Nội
C. Đà Nẵng
D. Cần Thơ
ĐÁP ÁN: B
Lời giải: Theo Hiến pháp Việt Nam, Hà Nội là thủ đô của nước CHXHCN Việt Nam.`,

  GPLX_CRITICAL: `Câu 18. [ĐIỂM LIỆT] Người điều khiển xe mô tô hai bánh, xe gắn máy có được phép buông cả hai tay khi đang tham gia giao thông không?
1. Được phép nếu đường vắng.
2. Không được phép.
3. Được phép khi có việc khẩn cấp.
ĐÁP ÁN: 2
Giải thích: Hành vi buông cả hai tay khi đang điều khiển xe máy là hành vi bị nghiêm cấm vì tiềm ẩn nguy cơ tai nạn giao thông thảm khốc.`,

  SAT_INTERNATIONAL: `Task #42: If 3x + 7 = 22, what is the value of 6x - 5?
[A] 25
[B] 29
[C] 30
[D] 35
[Key: A]
[Rationale] First solve for x: 3x = 15 => x = 5. Then substitute into 6(5) - 5 = 30 - 5 = 25.`,

  WEIRD_UNCONVENTIONAL: `# 1. Đâu là kiến trúc tối thượng của Hệ Thống Đấu Trường Trí Tuệ AegisQuiz?
>>A<< Microservices kết hợp CIG Engine động
>>B<< Monolith cũ kỹ thập niên 90
>>C<< Ứng dụng desktop đơn máy
>>D<< Trang HTML tĩnh
FLAG: A
Lời giải: AegisQuiz tích hợp CIG Engine và Arena Gameshow Plugin System độc nhất vô nhị.`,

  GAOKAO_CHINA: `第一部分  阅读理解
1. 中国的首都是哪个城市？
A. 上海
B. 北京
C. 广州
D. 深圳
答案：B
解析：北京是中国的首都，也是政治、文化中心。`,

  SUNEUNG_KOREA: `1. 한국의 수도는 어디입니까?
① 부산
② 서울
③ 인천
④ 대구
⑤ 광주
정답: ②
해설: 서울은 대한민국의 수도입니다.`
};

export const RuleSandboxPanel: React.FC<RuleSandboxPanelProps> = ({
  rules,
  snippetText,
  setSnippetText,
  examHint,
  setExamHint,
  selectedRuleCode,
  setSelectedRuleCode,
  isParsing,
  isAiGenerating,
  isSavingRule,
  parseResult,
  aiAutopilotResult,
  onRunTest,
  onAiAutopilot,
  onSaveCustomRule
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left Column: Input and Sandbox Controls */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-purple-400" />
              Live Document Sandbox & AI Autopilot
            </h3>
            <span className="text-[11px] text-slate-400">Thử nghiệm trực tiếp 0ms</span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chọn mẫu đề thi thử nghiệm nhanh:</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setSnippetText(PRESET_SNIPPETS.R_GEN_DIRECTIVE_TEST); setSelectedRuleCode('GENERAL_UNIVERSAL_INGESTION'); }}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-200 hover:border-amber-400 transition-all cursor-pointer shadow-sm"
              >
                ⭐ R_GEN Chỉ Thị (Đúng/Sai + Điền số)
              </button>
              <button
                type="button"
                onClick={() => { setSnippetText(PRESET_SNIPPETS.VN_STANDARD); setSelectedRuleCode('VN_STANDARD_MULTIPLE_CHOICE'); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-950 border border-slate-800 text-slate-300 hover:border-blue-500/50 hover:text-white transition-all cursor-pointer"
              >
                📝 Trắc nghiệm Chuẩn
              </button>
              <button
                type="button"
                onClick={() => { setSnippetText(PRESET_SNIPPETS.GPLX_CRITICAL); setSelectedRuleCode('GPLX_NATIONAL_DRIVING_TEST'); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-950 border border-red-500/30 text-red-300 hover:border-red-500 hover:text-white transition-all cursor-pointer"
              >
                ⚠️ Sát Hạch GPLX
              </button>
              <button
                type="button"
                onClick={() => { setSnippetText(PRESET_SNIPPETS.SAT_INTERNATIONAL); setSelectedRuleCode('INTERNATIONAL_SAT_LOGIC'); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-950 border border-amber-500/30 text-amber-300 hover:border-amber-500 hover:text-white transition-all cursor-pointer"
              >
                🌐 Đề SAT
              </button>
              <button
                type="button"
                onClick={() => { setSnippetText(PRESET_SNIPPETS.GAOKAO_CHINA); setSelectedRuleCode('CHINA_GAOKAO_STANDARD'); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-950 border border-red-400/30 text-red-300 hover:border-red-400 hover:text-white transition-all cursor-pointer"
              >
                🇨🇳 Gaokao
              </button>
              <button
                type="button"
                onClick={() => { setSnippetText(PRESET_SNIPPETS.WEIRD_UNCONVENTIONAL); setSelectedRuleCode(''); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-fuchsia-950/40 border border-fuchsia-500/50 text-fuchsia-300 hover:border-fuchsia-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <BrainCircuit size={13} className="text-fuchsia-400" />
                🚀 Đề Dị Biệt (Test AI Autopilot)
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nội dung đoạn văn bản đề thi thô:</label>
            <textarea
              value={snippetText}
              onChange={(e) => setSnippetText(e.target.value)}
              rows={8}
              placeholder="Dán câu hỏi thử nghiệm vào đây..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors leading-relaxed resize-y"
            />
          </div>

          {/* AI Hint Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gợi ý loại đề cho AI Autopilot (Tùy chọn):</label>
            <input
              type="text"
              value={examHint}
              onChange={(e) => setExamHint(e.target.value)}
              placeholder="Ví dụ: Đề thi Olympic, Đề thi dạng Hash..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex-1">
              <select
                value={selectedRuleCode}
                onChange={(e) => setSelectedRuleCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="">⚡ Tự động nhận diện quy tắc (Auto-Detect)</option>
                {rules.map((r) => (
                  <option key={r.ruleCode} value={r.ruleCode}>
                    [{r.ruleCode}] {r.ruleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRunTest}
                disabled={isParsing || isAiGenerating || !snippetText.trim()}
                className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play size={13} className={isParsing ? 'animate-spin' : ''} />
                {isParsing ? 'Đang chạy...' : 'Phân Tích'}
              </button>

              <button
                type="button"
                onClick={onAiAutopilot}
                disabled={isAiGenerating || isParsing || !snippetText.trim()}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-purple-500/25 active:scale-95 cursor-pointer disabled:opacity-50 ring-1 ring-white/20"
              >
                <Bot size={15} className={isAiGenerating ? 'animate-bounce' : ''} />
                {isAiGenerating ? 'AI Đang Suy Diễn...' : '🤖 AI Rule Autopilot'}
              </button>
            </div>
          </div>

          {/* AI Autopilot Synthesized Rule Card */}
          {aiAutopilotResult && (
            <div className="mt-4 bg-gradient-to-br from-purple-950/40 via-slate-950/90 to-slate-900 border border-purple-500/40 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={18} className="text-fuchsia-400" />
                  <span className="text-xs font-black uppercase text-white tracking-wide">
                    Quy Tắc Tự Động Sinh: {aiAutopilotResult.generatedRule.ruleName}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                  <Check size={12} />
                  <span>Độ tin cậy: {aiAutopilotResult.confidenceScore}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic">
                &ldquo;{aiAutopilotResult.reasoning}&rdquo;
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Anchor Regex:</span>
                  <span className="text-amber-300 truncate block">{aiAutopilotResult.generatedRule.anchorSpec?.regexPattern}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Options Regex:</span>
                  <span className="text-emerald-300 truncate block">{aiAutopilotResult.generatedRule.interactionSpec?.optionRegexPattern}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Answer Regex:</span>
                  <span className="text-teal-300 truncate block">{aiAutopilotResult.generatedRule.evaluationSpec?.answerRegexPattern}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={onSaveCustomRule}
                  disabled={isSavingRule}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Zap size={14} className={isSavingRule ? 'animate-spin' : ''} />
                  {isSavingRule ? 'Đang lưu vào Engine...' : '⚡ Kích Hoạt & Lưu Quy Tắc Này Ngay (Zero-Downtime)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Parsed Results and Logs */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4 min-h-[460px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                Kết Quả Bóc Tách Trực Quan (CIG Output)
              </h3>
              {parseResult && (
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${parseResult.success ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {parseResult.success ? `Bóc tách: ${parseResult.parsedCount} câu hỏi` : 'Thất bại'}
                </span>
              )}
            </div>

            {/* Questions list */}
            {parseResult?.questions && parseResult.questions.length > 0 ? (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {parseResult.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      q.isCritical
                        ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Loại: {q.questionType}
                        </span>
                        {q.isCritical && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 animate-pulse">
                            <ShieldAlert size={12} />
                            ⚠️ Điểm Liệt Tử Thần
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Quy tắc: {parseResult.matchedRuleCode}</span>
                    </div>

                    <p className="text-xs font-semibold text-amber-200/90 leading-relaxed mb-3">
                      {q.content}
                    </p>

                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5 my-3 pl-2 border-l-2 border-emerald-500/40">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="text-xs text-emerald-300 font-medium">
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.suggestedAnswer && (
                      <div className="mt-3 flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-xl p-2.5">
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider">Đáp án:</span>
                        <span className="text-xs font-black text-teal-200">{q.suggestedAnswer}</span>
                      </div>
                    )}

                    {q.aiExplanation && (
                      <div className="mt-2 text-[11px] text-purple-300/90 bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 italic">
                        <span className="font-bold text-purple-400 not-italic mr-1">💡 Lời giải:</span>
                        {q.aiExplanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <FileCode size={36} className="mx-auto text-slate-600 opacity-50" />
                <p className="text-xs font-medium">Chưa có kết quả bóc tách nào.</p>
                <p className="text-[11px] text-slate-600">Dán đoạn đề thi ở cột trái và bấm &ldquo;Phân Tích&rdquo; để xem kết quả.</p>
              </div>
            )}
          </div>

          {/* Logs */}
          {parseResult?.parsingLogs && parseResult.parsingLogs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Terminal size={12} className="text-emerald-400" />
                Live Ingestion Stream Logs:
              </div>
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 font-mono text-[10px] text-slate-400 space-y-1 max-h-28 overflow-y-auto">
                {parseResult.parsingLogs.map((log, lIdx) => (
                  <div key={lIdx} className="leading-tight">
                    <span className="text-slate-600 mr-1.5">[{lIdx + 1}]</span>
                    <span className={log.includes('Anchor') ? 'text-amber-400' : log.includes('Option') ? 'text-emerald-400' : log.includes('Answer') ? 'text-teal-400' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

