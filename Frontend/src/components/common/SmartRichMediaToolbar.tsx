import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Square, Volume2, Video, Table, Sigma, Sparkles } from 'lucide-react';
import { compressImageToDataUri, readBlobAsDataUri } from '@/shared/lib/quiz/smartClipboardMedia';
import { transpileClipboardMathTypeViaApi } from '@/shared/lib/quiz/mathtypeClipboardClient';
import { MathFormulaStudioModal } from './math-studio/MathFormulaStudioModal';

interface SmartRichMediaToolbarProps {
  value: string;
  onChange: (nextVal: string) => void;
  compact?: boolean;
  onNotify?: (msg: string) => void;
}

export const SmartRichMediaToolbar: React.FC<SmartRichMediaToolbarProps> = ({
  value,
  onChange,
  compact = false,
  onNotify,
}) => {
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMathStudioOpen, setIsMathStudioOpen] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const appendSnippet = (snippet: string, inline = false) => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      onChange(snippet);
      return;
    }
    onChange(inline ? `${value} ${snippet}` : `${value}\n${snippet}`);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uri = await compressImageToDataUri(file);
    appendSnippet(`![${file.name.replace(/\.[^.]+$/, '') || 'Hình minh họa'}](${uri})`, compact);
    onNotify?.('Đã chèn Hình ảnh trực quan!');
  };

  const handleAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uri = await readBlobAsDataUri(file);
    appendSnippet(`[Audio](${uri})`, compact);
    onNotify?.('Đã đính kèm Âm thanh!');
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uri = await readBlobAsDataUri(file);
    appendSnippet(`[Video](${uri})`, compact);
    onNotify?.('Đã đính kèm Video trực quan!');
  };

  const toggleVoiceRecording = async () => {
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = ev => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const uri = await readBlobAsDataUri(blob);
        appendSnippet(`[Audio](${uri})`, compact);
        onNotify?.('Đã thu âm giọng đọc và chèn vào câu hỏi!');
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      onNotify?.('Không thể mở Micro. Vui lòng cấp quyền Micro trên trình duyệt hoặc chọn file âm thanh.');
    }
  };

  const handleVideoAction = () => {
    const url = window.prompt(
      'Dán đường dẫn Video YouTube (ví dụ: https://www.youtube.com/watch?v=...) hoặc để trống để chọn file Video (.mp4) từ máy tính:'
    );
    if (url && url.trim()) {
      appendSnippet(`[Video](${url.trim()})`, compact);
      onNotify?.('Đã nhúng Video bài học!');
    } else if (url === '') {
      videoInputRef.current?.click();
    }
  };

  const handleInsertTable = () => {
    const sampleTable = `| Tiêu chí | Cột A | Cột B |\n| --- | --- | --- |\n| Dòng 1 | Giá trị 1 | Giá trị 2 |\n| Dòng 2 | Giá trị 3 | Giá trị 4 |`;
    appendSnippet(sampleTable, false);
    onNotify?.('Đã chèn mẫu Bảng biểu (Mẹo: Bạn có thể Copy bảng từ Word/Excel rồi Ctrl+V thẳng vào ô)!')
  };

  const handleInsertMath = () => {
    setIsMathStudioOpen(true);
  };

  const [isConvertingMathImg, setIsConvertingMathImg] = useState(false);
  const hasEmbeddedImage = /!\[[^\]]*\]\((data:image\/[^)]+)\)/.test(value || '');

  const handleConvertEmbeddedImageToLatex = async () => {
    const match = (value || '').match(/!\[[^\]]*\]\((data:image\/[^)]+)\)/);
    if (!match) return;
    setIsConvertingMathImg(true);
    onNotify?.('⏳ Đang nhận diện và chuyển đổi ảnh công thức sang LaTeX ($...$)...');
    try {
      const res = await transpileClipboardMathTypeViaApi({ imageDataUri: match[1] });
      if (res.success && res.singleLatex) {
        onChange((value || '').replace(match[0], res.singleLatex));
        onNotify?.('Đã chuyển đổi ảnh công thức sang chuẩn Vector LaTeX ($...$)!');
      } else {
        onNotify?.('Ảnh này là hình minh họa (không phải công thức toán đơn thuần), hệ thống giữ nguyên ảnh.');
      }
    } finally {
      setIsConvertingMathImg(false);
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioFile} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={handleVideoFile} />

      {hasEmbeddedImage && (
        <button
          type="button"
          disabled={isConvertingMathImg}
          onClick={handleConvertEmbeddedImageToLatex}
          title="Chuyển đổi ảnh công thức Toán đang có trong ô này thành mã LaTeX ($...$) siêu nhẹ"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[11px] font-bold transition-all cursor-pointer animate-pulse"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{isConvertingMathImg ? 'Đang dịch LaTeX...' : '✨ Đổi Ảnh -> LaTeX'}</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => imgInputRef.current?.click()}
        title="Chèn hình ảnh từ máy tính (hoặc bấm Ctrl+V dán thẳng ảnh chụp màn hình / ảnh từ Word)"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/25 text-slate-300 hover:text-indigo-300 border border-slate-700/80 hover:border-indigo-500/40 text-[11px] font-semibold transition-all cursor-pointer"
      >
        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span>{compact ? 'Ảnh' : '🖼️ Ảnh (hoặc Ctrl+V)'}</span>
      </button>

      <button
        type="button"
        onClick={toggleVoiceRecording}
        title="Thu âm trực tiếp giọng đọc của Giáo viên cho học sinh nghe"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
          isRecording
            ? 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse'
            : 'bg-slate-800/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border-slate-700/80 hover:border-rose-500/40'
        }`}
      >
        {isRecording ? <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
        <span>{isRecording ? 'Dừng thu' : compact ? 'Thu âm' : '🎙️ Thu âm giọng cô'}</span>
      </button>

      {!compact && (
        <>
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            title="Tải file âm thanh (.mp3, .wav) từ máy tính"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/80 hover:border-sky-500/40 text-[11px] font-semibold transition-all cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Audio</span>
          </button>

          <button
            type="button"
            onClick={handleVideoAction}
            title="Nhúng Video hoạt hình YouTube hoặc tải file Video .mp4"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40 text-[11px] font-semibold transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>🎬 Video / YouTube</span>
          </button>

          <button
            type="button"
            onClick={handleInsertTable}
            title="Chèn Bảng số liệu (hoặc Copy bảng từ Word/Excel rồi Ctrl+V thẳng vào ô)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-slate-700/80 hover:border-purple-500/40 text-[11px] font-semibold transition-all cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-purple-400" />
            <span>Bảng</span>
          </button>
        </>
      )}

      <button
        type="button"
        onClick={handleInsertMath}
        title="Mở hệ soạn thảo công thức Toán học toàn diện (KaTeX, mhchem, mẫu đề thi)"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 text-[11px] font-semibold transition-all cursor-pointer"
      >
        <Sigma className="w-3.5 h-3.5 text-cyan-400" />
        <span>Toán</span>
      </button>

      {isMathStudioOpen && (
        <MathFormulaStudioModal
          isOpen={isMathStudioOpen}
          onClose={() => setIsMathStudioOpen(false)}
          onInsert={(formula) => {
            appendSnippet(formula, true);
            onNotify?.('Đã chèn công thức Toán học chuẩn!');
          }}
        />
      )}
    </div>
  );
};
export default SmartRichMediaToolbar;

