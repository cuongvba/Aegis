import React, { useState } from 'react';
import {
  Headphones,
  GitBranch,
  BookOpen,
  FileText,
  HelpCircle,
  Clock,
  Layers,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { notebookService, type NotebookStudioArtifactDto } from '@/services/notebook.service';
import { MathRenderer } from '@/components/common/MathRenderer';
import { NotebookPodcastPlayer } from './NotebookPodcastPlayer';

interface NotebookStudioPanelProps {
  notebookId: string;
  notebookTitle: string;
}

const STUDIO_TOOLS = [
  { id: 'AUDIO_PODCAST', label: 'Podcast 2 MC', icon: Headphones, color: 'from-fuchsia-600 to-indigo-600' },
  { id: 'MIND_MAP', label: 'Sơ đồ Tư duy', icon: GitBranch, color: 'from-cyan-600 to-sky-600' },
  { id: 'STUDY_GUIDE', label: 'Cẩm nang Ôn tập', icon: BookOpen, color: 'from-emerald-600 to-teal-600' },
  { id: 'BRIEFING', label: 'Tóm tắt Điều hành', icon: FileText, color: 'from-amber-600 to-orange-600' },
  { id: 'FAQ', label: 'FAQ Hỏi-Đáp', icon: HelpCircle, color: 'from-violet-600 to-purple-600' },
  { id: 'TIMELINE', label: 'Dòng thời gian', icon: Clock, color: 'from-rose-600 to-pink-600' },
  { id: 'FLASHCARDS', label: 'Flashcards', icon: Layers, color: 'from-indigo-600 to-blue-600' },
];

export const NotebookStudioPanel: React.FC<NotebookStudioPanelProps> = ({
  notebookId,
  notebookTitle,
}) => {
  const [focusPrompt, setFocusPrompt] = useState('');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<NotebookStudioArtifactDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (artifactType: string) => {
    setLoadingType(artifactType);
    setError(null);
    try {
      const res = await notebookService.generateStudioArtifact(notebookId, {
        artifactType,
        language,
        focusPrompt: focusPrompt.trim() || undefined,
      });
      setArtifact(res);
    } catch {
      setError('Không thể tạo nội dung Studio lúc này. Vui lòng thử lại.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleOpenInOfficeStudio = () => {
    if (!artifact) return;
    localStorage.setItem(
      'aegis-office-studio-draft-v1',
      JSON.stringify({
        docKind: 'DOCX',
        title: artifact.title || notebookTitle,
        markdown: artifact.contentMarkdown,
        sheets: [],
      })
    );
    window.open('/office-studio', '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="pb-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            Aegis Notebook Studio (Vượt chuẩn NotebookLM)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chuyển hóa đa nguồn tài liệu thành Podcast 2 MC, Sơ đồ tư duy, Cẩm nang ôn tập, Flashcards & Xuất Word A4
          </p>
        </div>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
          className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200"
        >
          <option value="vi">🇻🇳 Tiếng Việt</option>
          <option value="en">🇺🇸 English</option>
        </select>
      </div>

      <input
        value={focusPrompt}
        onChange={(e) => setFocusPrompt(e.target.value)}
        placeholder="Trọng tâm tùy chọn (VD: Tập trung vào rủi ro pháp lý hoặc kiến thức trọng tâm thi THPT)..."
        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-fuchsia-500 focus:outline-none"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {STUDIO_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const busy = loadingType === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              disabled={Boolean(loadingType)}
              onClick={() => handleGenerate(tool.id)}
              className={`rounded-2xl bg-gradient-to-br ${tool.color} p-3 text-left text-white shadow-md hover:brightness-110 disabled:opacity-60 transition flex items-center gap-2.5`}
            >
              {busy ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Icon size={16} className="shrink-0" />}
              <span className="text-xs font-black">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-950/50 border border-rose-500/40 p-3 text-xs text-rose-200 font-semibold">
          {error}
        </div>
      )}

      {artifact && (
        <div className="space-y-4">
          {artifact.artifactType === 'AUDIO_PODCAST' && artifact.podcastTurns.length > 0 && (
            <NotebookPodcastPlayer
              title={artifact.title}
              turns={artifact.podcastTurns}
              language={language}
            />
          )}

          <div className="rounded-2xl border border-slate-700 bg-white text-slate-900 p-5 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                {artifact.title}
              </span>
              <button
                type="button"
                onClick={handleOpenInOfficeStudio}
                className="inline-flex items-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-bold text-white"
              >
                <ExternalLink size={13} /> Mở & Xuất Word tại Office Studio
              </button>
            </div>
            <MathRenderer content={artifact.contentMarkdown} className="text-sm leading-relaxed space-y-2" />
          </div>
        </div>
      )}
    </div>
  );
};
