import React, { useRef, useState } from 'react';
import { X, Feather, Mic, Square, Image as ImageIcon, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { kidsCurriculumService } from '@/services/kidsCurriculum.service';
import { telemetryFeedbackService } from '@/services/telemetry-feedback.service';

interface YouthCreatorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

const ENV_PRESETS = [
  { label: '☁️ Bầu Trời', grad: 'from-sky-400 via-cyan-300 to-indigo-400', pMode: 'sky' as const, sfx: 'pop' as const, env: 'SKY' },
  { label: '🌊 Đáy Biển', grad: 'from-cyan-500 via-teal-500 to-blue-700', pMode: 'ocean' as const, sfx: 'splash' as const, env: 'OCEAN' },
  { label: '🧚 Cổ Tích', grad: 'from-fuchsia-500 via-purple-600 to-indigo-700', pMode: 'fairy' as const, sfx: 'unwrap' as const, env: 'FAIRYTALE' },
  { label: '🌿 Thảo Nguyên', grad: 'from-emerald-400 via-lime-400 to-amber-300', pMode: 'meadow' as const, sfx: 'bounce' as const, env: 'MEADOW' },
];

export const YouthCreatorStudioModal: React.FC<YouthCreatorStudioModalProps> = ({ isOpen, onClose, lang }) => {
  const [authorName, setAuthorName] = useState('');
  const [authorClass, setAuthorClass] = useState('');
  const [creatorDream, setCreatorDream] = useState('');
  const [islandId, setIslandId] = useState('fairytale');
  const [ageBand, setAgeBand] = useState('6-8');

  // Custom Stage
  const [stageTitle, setStageTitle] = useState('');
  const [envIdx, setEnvIdx] = useState(2);
  const [stageProps, setStageProps] = useState('🦋,🌸,✨,🦄');
  const [backdropUrl, setBackdropUrl] = useState('');

  // Story / Lesson Atom
  const [primaryText, setPrimaryText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [emoji, setEmoji] = useState('🌟');
  const [storyText, setStoryText] = useState('');
  const [funFact, setFunFact] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiIdea, setAiIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isVi = lang === 'vi';

  if (!isOpen) return null;

  const handleAiDraft = async () => {
    if (!aiIdea.trim()) return;
    setIsAiDrafting(true);
    try {
      const draft = await kidsCurriculumService.aiSynthesizeBundle(aiIdea.trim(), islandId, ageBand, 3);
      if (draft.creatorDream) setCreatorDream(draft.creatorDream);
      if (draft.customStage) {
        setStageTitle(draft.customStage.titleVi || '');
        if (draft.customStage.props?.length) {
          setStageProps(draft.customStage.props.map((p) => p.emoji).join(','));
        }
        const matchedEnv = ENV_PRESETS.findIndex((p) => p.pMode === draft.customStage?.particleMode);
        if (matchedEnv >= 0) setEnvIdx(matchedEnv);
      }
      const first = draft.atoms?.[0];
      if (first) {
        setEmoji(first.emoji || '🌟');
        setPrimaryText(first.primaryText || '');
        setSecondaryText(first.secondaryText || '');
        setStoryText(first.sampleSentenceVi || '');
        setFunFact(first.funFactVi || '');
      }
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleUploadFile = async (file: File, target: 'backdrop' | 'image' | 'voice') => {
    setIsUploading(true);
    try {
      const res = await telemetryFeedbackService.uploadFeedbackMedia(file);
      if (target === 'backdrop') setBackdropUrl(res.url);
      else if (target === 'image') setImageUrl(res.url);
      else setVoiceUrl(res.url);
    } catch {
      alert(isVi ? 'Không tải lên được tệp (tối đa 15MB).' : 'Upload failed (max 15MB).');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `story-voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await handleUploadFile(file, 'voice');
      };
      recorderRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch {
      alert(isVi ? 'Trình duyệt chưa cấp quyền Micro hoặc bạn có thể tải file MP3/WAV lên.' : 'Microphone unavailable; you can upload an audio file instead.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secondaryText.trim() && !primaryText.trim()) return;
    setIsSubmitting(true);
    try {
      const preset = ENV_PRESETS[envIdx] || ENV_PRESETS[0];
      const colors = ['#f43f5e', '#f59e0b', '#0ea5e9', '#a855f7', '#10b981'];
      const res = await kidsCurriculumService.submitCreatorBundle({
        authorName: authorName.trim() || 'Anh/Chị Tác Giả Trẻ',
        authorClass: authorClass.trim() || undefined,
        creatorDream: creatorDream.trim() || undefined,
        customStage: stageTitle.trim()
          ? {
              stageCode: '',
              titleVi: stageTitle.trim(),
              titleEn: stageTitle.trim(),
              environment: preset.env,
              particleMode: preset.pMode,
              sfxType: preset.sfx,
              backgroundGradient: preset.grad,
              badgeEmoji: emoji || '🌟',
              backdropImageUrl: backdropUrl || undefined,
              isSystemDefault: false,
              preferredIslands: [islandId],
              props: stageProps.split(',').map((s) => s.trim()).filter(Boolean).map((em, idx) => ({
                emoji: em,
                labelVi: `${stageTitle.trim()} #${idx + 1}`,
                labelEn: `${stageTitle.trim()} #${idx + 1}`,
                colorHex: colors[idx % colors.length],
              })),
            }
          : undefined,
        atoms: [
          {
            islandId,
            ageBand,
            emoji: emoji || '🌟',
            primaryText: primaryText.trim() || secondaryText.trim(),
            secondaryText: secondaryText.trim() || primaryText.trim(),
            sampleSentenceVi: storyText.trim() || secondaryText.trim(),
            sampleSentenceEn: storyText.trim() || primaryText.trim(),
            funFactVi: funFact.trim(),
            funFactEn: funFact.trim(),
            imageUrl: imageUrl || undefined,
            voiceAudioUrl: voiceUrl || undefined,
          },
        ],
      });
      setDoneMsg(res.message);
      setTimeout(() => { setDoneMsg(null); onClose(); }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl space-y-4">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white">
            <Feather size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {isVi ? 'Xưởng Sáng Tạo Giáo Án & Thế Giới Tuổi Thơ (Giáo Viên & Tác Giả Trẻ)' : 'Kids World Creator Studio (Teachers & Youth)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isVi ? 'AI Co-Pilot hỗ trợ cô giáo Mầm non/Tiểu học & tác giả trẻ dựng sân khấu, tranh vẽ & thu âm câu chuyện' : 'AI Co-Pilot helps teachers & youth creators build stages, stories & voice narrations'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            value={aiIdea}
            onChange={(e) => setAiIdea(e.target.value)}
            placeholder={isVi ? '✨ Nhập ý tưởng giáo án (VD: 4 mùa Xuân Hạ Thu Đông)...' : '✨ Enter lesson idea for AI Co-Pilot...'}
            className="flex-1 rounded-xl bg-slate-950/90 border border-indigo-500/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            disabled={isAiDrafting || !aiIdea.trim()}
            onClick={handleAiDraft}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-xs font-black text-white shadow-md disabled:opacity-50"
          >
            {isAiDrafting ? <Loader2 size={14} className="animate-spin" /> : '✨'}
            {isAiDrafting ? (isVi ? 'AI đang dựng...' : 'Drafting...') : (isVi ? 'AI Dựng Sân Khấu & Giáo Án' : 'AI Draft Stage & Story')}
          </button>
        </div>

        {doneMsg && (
          <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={16} /> {doneMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder={isVi ? 'Tên tác giả (VD: Minh Anh)' : 'Your name'} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            <input value={authorClass} onChange={(e) => setAuthorClass(e.target.value)} placeholder={isVi ? 'Lớp / Trường (VD: Lớp 10A2 THPT...)' : 'Class / School'} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
          </div>
          <input value={creatorDream} onChange={(e) => setCreatorDream(e.target.value)} placeholder={isVi ? 'Lời nhắn / Ước mơ gửi các em nhỏ...' : 'Your dream or message for younger kids...'} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-amber-200" />

          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 space-y-2">
            <div className="font-bold text-cyan-300">{isVi ? '1. Đóng Góp Sân Khấu & Tài Nguyên Riêng (Tùy chọn)' : '1. Custom Stage & Backdrop (Optional)'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input value={stageTitle} onChange={(e) => setStageTitle(e.target.value)} placeholder={isVi ? 'Tên sân khấu mới...' : 'Stage name...'} className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-white" />
              <select value={envIdx} onChange={(e) => setEnvIdx(Number(e.target.value))} className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-1.5 text-white">
                {ENV_PRESETS.map((p, i) => <option key={p.env} value={i}>{p.label}</option>)}
              </select>
              <input value={stageProps} onChange={(e) => setStageProps(e.target.value)} placeholder="Emoji vật phẩm: 🦋,🌸,✨" className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white" />
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-cyan-300 hover:text-cyan-200">
              <ImageIcon size={13} /> {backdropUrl ? '✓ Đã tải ảnh nền sân khấu' : (isVi ? 'Tải ảnh nền sân khấu do bạn vẽ/chụp' : 'Upload custom stage backdrop')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], 'backdrop')} />
            </label>
          </div>

          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 space-y-2">
            <div className="font-bold text-amber-300">{isVi ? '2. Nội Dung Bài Học / Câu Chuyện & Giọng Kể' : '2. Story / Lesson & Voice Narration'}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select value={islandId} onChange={(e) => setIslandId(e.target.value)} className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-1.5 text-white">
                <option value="music">🎵 Lời Ca</option>
                <option value="animals">🦁 Muôn Thú</option>
                <option value="toys">🧸 Đồ Chơi</option>
                <option value="fairytale">🧚 Thần Tiên</option>
              </select>
              <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)} className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-1.5 text-white">
                <option value="3-5">3–5 tuổi</option>
                <option value="6-8">6–8 tuổi</option>
                <option value="9-11">9–11 tuổi</option>
              </select>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-1.5 text-center text-base" />
              <input value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} placeholder="Từ khóa (EN)" className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white" />
            </div>
            <input required value={secondaryText} onChange={(e) => setSecondaryText(e.target.value)} placeholder={isVi ? 'Tên bài học / Tiêu đề tiếng Việt *' : 'Lesson title *'} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white" />
            <textarea rows={2} value={storyText} onChange={(e) => setStoryText(e.target.value)} placeholder={isVi ? 'Lời kể chuyện / Lời bài hát cho các em...' : 'Story or song lyrics for kids...'} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white" />
            <input value={funFact} onChange={(e) => setFunFact(e.target.value)} placeholder={isVi ? 'Điều kỳ diệu (Fun fact)...' : 'Fun fact...'} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-white" />

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="button" onClick={toggleRecording} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold ${isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-amber-300 hover:bg-slate-700'}`}>
                {isRecording ? <Square size={12} /> : <Mic size={13} />}
                {isRecording ? 'Dừng ghi âm' : voiceUrl ? '✓ Đã ghi giọng kể' : 'Thu âm giọng kể'}
              </button>
              <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-cyan-300 font-bold cursor-pointer">
                <ImageIcon size={13} /> {imageUrl ? '✓ Đã tải tranh minh họa' : 'Tải tranh / ảnh minh họa'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], 'image')} />
              </label>
              {isUploading && <Loader2 size={14} className="animate-spin text-cyan-400" />}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting || isUploading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50">
            <Send size={15} /> {isSubmitting ? 'Đang gửi tác phẩm...' : (isVi ? 'Gửi Đóng Góp Vào Kids World (Chờ Duyệt An Toàn)' : 'Submit for Child-Safe Review')}
          </button>
        </form>
      </div>
    </div>
  );
};
