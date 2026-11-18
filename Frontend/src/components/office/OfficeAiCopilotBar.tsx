import React, { useState } from 'react';
import { Sparkles, Loader2, Check, PlusCircle, X, Wand2, Eye, Code2 } from 'lucide-react';
import { officeWorkspaceService, type OfficeSheet } from '@/services/officeWorkspace.service';
import { MathRenderer } from '@/components/common/MathRenderer';

interface OfficeAiCopilotBarProps {
  docKind: 'DOCX' | 'PDF' | 'XLSX' | 'MARKDOWN';
  title: string;
  markdownContent: string;
  sheets: OfficeSheet[];
  onReplaceMarkdown: (next: string) => void;
  onAppendMarkdown: (addition: string) => void;
  onKidsCreated: () => void;
}

export const OfficeAiCopilotBar: React.FC<OfficeAiCopilotBarProps> = ({
  docKind,
  title,
  markdownContent,
  sheets,
  onReplaceMarkdown,
  onAppendMarkdown,
  onKidsCreated,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [rawPreviewMode, setRawPreviewMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const runAction = async (action: string) => {
    setIsBusy(true);
    setStatusMsg(null);
    try {
      const res = await officeWorkspaceService.runAiAssist({
        action,
        title,
        markdownContent,
        sheets: docKind === 'XLSX' ? sheets : undefined,
        customInstruction: action === 'CUSTOM' ? customPrompt : undefined,
      });
      setAiPreview(res.resultMarkdown);
      setStatusMsg(res.message);
    } catch {
      setStatusMsg('Không thể gọi Trợ lý AI lúc này.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendToKids = async () => {
    setIsBusy(true);
    setStatusMsg(null);
    try {
      await officeWorkspaceService.sendToKids({
        title,
        markdownContent,
        islandId: 'heritage',
        ageBand: '6-8',
      });
      setStatusMsg('Đã chuyển hóa tài liệu thành bài học Kids World!');
      onKidsCreated();
    } catch {
      setStatusMsg('Không thể tạo bài Kids World lúc này.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/80 border border-indigo-500/30 p-3.5 space-y-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 mr-1">
          <Sparkles size={14} /> AI Office Co-Pilot:
        </span>

        {docKind === 'XLSX' ? (
          <button type="button" disabled={isBusy} onClick={() => runAction('ANALYZE_SHEET')} className="rounded-xl bg-emerald-600/90 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
            📊 Phân tích Bảng điểm / Số liệu
          </button>
        ) : (
          <>
            <button type="button" disabled={isBusy} onClick={() => runAction('POLISH_LESSON')} className="rounded-xl bg-indigo-600/90 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white">
              ✨ Chuẩn hóa Giáo án
            </button>
            <button type="button" disabled={isBusy} onClick={() => runAction('GENERATE_QUIZ')} className="rounded-xl bg-cyan-600/90 hover:bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white">
              📝 Sinh 5 Câu Trắc nghiệm
            </button>
            <button type="button" disabled={isBusy} onClick={() => runAction('SUMMARIZE')} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200">
              📌 Tóm tắt
            </button>
            <button type="button" disabled={isBusy} onClick={() => runAction('TRANSLATE_BILINGUAL')} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200">
              🌐 Song ngữ Việt–Anh
            </button>
            <button type="button" disabled={isBusy} onClick={handleSendToKids} className="rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 px-3 py-1.5 text-xs font-black text-white">
              🌈 Tạo bài Kids World
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Hoặc nhờ AI theo ý riêng (VD: Chuyển thành kịch bản kể chuyện cho bé 5 tuổi)..."
          className="flex-1 min-w-[220px] rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="button"
          disabled={isBusy || !customPrompt.trim()}
          onClick={() => runAction('CUSTOM')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-3.5 py-1.5 text-xs font-black text-slate-950"
        >
          {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          AI Thực hiện
        </button>
      </div>

      {statusMsg && <p className="text-[11px] font-semibold text-cyan-300">{statusMsg}</p>}

      {aiPreview && (
        <div className="rounded-xl bg-slate-950 border border-indigo-500/40 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-indigo-300">Kết quả gợi ý từ AI Co-Pilot:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRawPreviewMode((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-amber-300"
              >
                {rawPreviewMode ? <Eye size={13} /> : <Code2 size={13} />}
                {rawPreviewMode ? 'Xem Công thức' : 'Xem Mã nguồn'}
              </button>
              {docKind !== 'XLSX' && (
                <>
                  <button
                    type="button"
                    onClick={() => { onReplaceMarkdown(aiPreview); setAiPreview(null); }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white"
                  >
                    <Check size={13} /> Thay thế văn bản
                  </button>
                  <button
                    type="button"
                    onClick={() => { onAppendMarkdown(aiPreview); setAiPreview(null); }}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 px-2.5 py-1 text-xs font-bold text-white"
                  >
                    <PlusCircle size={13} /> Chèn xuống cuối
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setAiPreview(null)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-bold text-slate-300"
              >
                <X size={13} /> Đóng
              </button>
            </div>
          </div>
          {rawPreviewMode ? (
            <pre className="whitespace-pre-wrap text-xs text-slate-200 font-mono max-h-60 overflow-y-auto bg-slate-900/70 rounded-lg p-3">
              {aiPreview}
            </pre>
          ) : (
            <div className="rounded-lg bg-white text-slate-900 p-4 max-h-72 overflow-y-auto text-sm leading-relaxed">
              <MathRenderer content={aiPreview} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
