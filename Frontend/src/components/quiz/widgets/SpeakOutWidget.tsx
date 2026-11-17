import { Mic, MicOff, Volume2, RotateCcw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { QuestionWidgetProps } from './types';

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const SPEECH_LANGS = [
  { code: 'en-US', label: 'EN (US)' },
  { code: 'vi-VN', label: 'VI' },
  { code: 'ja-JP', label: 'JA' },
  { code: 'zh-CN', label: 'ZH' },
  { code: 'ko-KR', label: 'KO' },
  { code: 'fr-FR', label: 'FR' },
];

export default function SpeakOutWidget({
  question,
  answer,
  onUpdate,
  disabled,
}: QuestionWidgetProps) {
  const defaultLang = String((question.payload as any)?.lang || 'en-US');
  const [speechLang, setSpeechLang] = useState(defaultLang);
  const [isRecording, setIsRecording] = useState(false);
  const [shadowBeat, setShadowBeat] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const spokenText = answer?.shortText ?? '';
  const targetPhrase = useMemo(() => {
    const raw =
      (question.payload as any)?.targetPhrase ||
      (question as any).correctOption ||
      question.answerRaw ||
      question.content ||
      '';
    return String(raw).replace(/<[^>]+>/g, '').trim();
  }, [question]);

  const targetTokens = useMemo(() => normalizeTokens(targetPhrase), [targetPhrase]);
  const spokenTokens = useMemo(() => normalizeTokens(spokenText), [spokenText]);

  const accuracyPct = useMemo(() => {
    if (targetTokens.length === 0 || spokenTokens.length === 0) return null;
    const hits = targetTokens.filter((tok) => spokenTokens.includes(tok)).length;
    return Math.round((hits / targetTokens.length) * 100);
  }, [targetTokens, spokenTokens]);

  const playNativeSample = (onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !targetPhrase) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(targetPhrase);
    utter.lang = speechLang;
    utter.rate = 0.92;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
  };

  const startRecording = () => {
    if (disabled) return;
    setSpeechError(null);
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechError('Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể nhập văn bản phát âm thủ công bên dưới.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((res: any) => res[0]?.transcript || '')
        .join(' ')
        .trim();
      onUpdate({ shortText: transcript });
    };

    recognition.onerror = (event: any) => {
      setSpeechError(`Không thể thu âm (${event.error}). Hãy kiểm tra quyền Micro.`);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const toggleRecording = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    startRecording();
  };

  const startShadowingMode = () => {
    if (disabled || isRecording) return;
    setShadowBeat('Đang phát mẫu...');
    playNativeSample(() => {
      setShadowBeat('Chuẩn bị nhại lại: 2...');
      window.setTimeout(() => {
        setShadowBeat('1... Nói ngay!');
        window.setTimeout(() => {
          setShadowBeat(null);
          startRecording();
        }, 450);
      }, 450);
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border-2 border-sky-200/80 bg-gradient-to-br from-sky-50/70 via-white to-indigo-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-extrabold uppercase tracking-wider text-sky-900">
          Speak Out AI &amp; Shadowing Đa Ngôn Ngữ
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value)}
            className="rounded-xl border border-sky-200 bg-white px-2 py-1.5 text-xs font-bold text-sky-900"
          >
            {SPEECH_LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => playNativeSample()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 transition shadow-sm"
          >
            <Volume2 className="h-3.5 w-3.5" /> Nghe mẫu
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={startShadowingMode}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-sm disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" /> Shadowing
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={toggleRecording}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition ${
              isRecording ? 'bg-rose-600 hover:bg-rose-500 animate-pulse' : 'bg-sky-600 hover:bg-sky-500'
            } disabled:opacity-50`}
          >
            {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {isRecording ? 'Dừng thu âm' : 'Bấm để Nói'}
          </button>
        </div>
      </div>

      {shadowBeat && (
        <div className="rounded-xl bg-indigo-600 text-white px-3 py-2 text-xs font-extrabold text-center animate-pulse">
          {shadowBeat}
        </div>
      )}

      {targetTokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-white/90 p-3 border border-slate-200">
          {targetTokens.map((tok, i) => {
            const matched = spokenTokens.includes(tok);
            return (
              <span
                key={`${tok}-${i}`}
                className={`rounded-lg px-2 py-0.5 text-sm font-bold transition ${
                  spokenTokens.length === 0
                    ? 'bg-slate-100 text-slate-700'
                    : matched
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                {tok}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          disabled={disabled}
          value={spokenText}
          onChange={(e) => onUpdate({ shortText: e.target.value })}
          placeholder="Kết quả nhận diện giọng nói sẽ hiển thị tại đây..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400"
        />
        {spokenText && !disabled && (
          <button
            type="button"
            onClick={() => onUpdate({ shortText: '' })}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
            title="Xóa"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {accuracyPct !== null && (
        <div className={`flex items-center gap-1.5 text-xs font-bold ${accuracyPct >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
          <CheckCircle2 className="h-4 w-4" />
          Độ khớp phát âm: {accuracyPct}% {accuracyPct >= 75 ? '(Đạt chuẩn!)' : '(Hãy thử đọc chậm và rõ hơn)'}
        </div>
      )}

      {speechError && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {speechError}
        </div>
      )}
    </div>
  );
}
