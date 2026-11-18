import React, { useMemo, useState } from 'react';
import { BookOpen, Copy, Check, Maximize2, Minimize2, Plus, Sparkles, Compass, Wand2, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DynamicVisualWidget } from '@/components/common/visual/DynamicVisualWidget';
import { InteractiveVisualStudioModal } from '@/components/common/visual/InteractiveVisualStudioModal';
import type { DynamicVisualSpec } from '@/components/common/visual/visual-types';
import {
  VISUAL_LESSON_PRESETS,
  type InteractiveVisualLesson,
} from '@/components/common/visual/visualLessonPresets';
import { ProblemVisualImporterModal } from './ProblemVisualImporterModal';

function tryParseUrlSpec(): InteractiveVisualLesson | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('spec');
    if (!raw) return null;
    const spec = JSON.parse(raw) as DynamicVisualSpec;
    return {
      id: 'shared_url_lesson',
      subject: 'TOAN',
      subjectLabel: 'Bài giảng chia sẻ',
      title: spec.title || 'Bài giảng Trực quan Tùy chỉnh',
      summary: spec.caption || 'Mô hình phương trình / hình học tương tác được chia sẻ trực tiếp qua liên kết.',
      discoveryPrompt: 'Điều chỉnh thanh trượt tham số hoặc bấm Chạy t để khám phá quy luật biến đổi.',
      spec,
    };
  } catch {
    return null;
  }
}

export default function VisualLearningLabPage() {
  const navigate = useNavigate();
  const sharedLesson = useMemo(() => tryParseUrlSpec(), []);
  const [lessons, setLessons] = useState<InteractiveVisualLesson[]>(() =>
    sharedLesson ? [sharedLesson, ...VISUAL_LESSON_PRESETS] : VISUAL_LESSON_PRESETS
  );
  const [selectedId, setSelectedId] = useState<string>(lessons[0].id);
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | 'TOAN' | 'VAT_LY' | 'HINH_HOC_3D'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [studioOpen, setStudioOpen] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);
  const [projectorMode, setProjectorMode] = useState(false);
  const [copiedType, setCopiedType] = useState<'link' | 'embed' | null>(null);

  const visibleLessons = useMemo(() => {
    const bySubject = subjectFilter === 'ALL' ? lessons : lessons.filter((l) => l.subject === subjectFilter);
    const q = searchQuery.trim().toLowerCase();
    return q ? bySubject.filter((l) => l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q)) : bySubject;
  }, [lessons, subjectFilter, searchQuery]);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === selectedId) || lessons[0],
    [lessons, selectedId]
  );

  const handleInsertCustomLesson = (snippet: string) => {
    const match = snippet.match(/\[AEGIS_VISUAL:(\{[\s\S]*\})\]/);
    if (!match) return;
    try {
      const spec = JSON.parse(match[1]) as DynamicVisualSpec;
      const custom: InteractiveVisualLesson = {
        id: `custom_${Date.now()}`,
        subject: spec.type === 'geometry_3d' ? 'HINH_HOC_3D' : 'TOAN',
        subjectLabel: 'Bài giảng tự thiết kế',
        title: spec.title || 'Mô hình Trực quan Mới',
        summary: spec.caption || 'Bài giảng tương tác 60fps vừa tạo từ Interactive Visual Studio.',
        discoveryPrompt: 'Tương tác với thanh trượt tham số hoặc trục thời gian t để kiểm chứng giả thuyết.',
        spec,
      };
      setLessons((prev) => [custom, ...prev]);
      setSelectedId(custom.id);
    } catch {
      // Bỏ qua snippet không hợp lệ
    }
  };

  const handleCopy = (type: 'link' | 'embed') => {
    const text =
      type === 'link'
        ? `${window.location.origin}/visual-lab?spec=${encodeURIComponent(JSON.stringify(activeLesson.spec))}`
        : `[AEGIS_VISUAL:${JSON.stringify(activeLesson.spec)}]`;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    window.setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Phòng Lab Bài Giảng Trực Quan 60fps
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                  ADVS Time-Morph
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Học sinh chủ động khám phá quy luật Toán · Vật Lý · Hình học 3D qua đồ thị biến đổi theo thời gian thực
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setImporterOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg transition"
            >
              <Wand2 className="h-4 w-4" /> Nạp Đề / Bài Toán Bất Kỳ
            </button>
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg transition"
            >
              <Plus className="h-4 w-4" /> Thiết kế Bài giảng Động
            </button>
            <button
              type="button"
              onClick={() => setProjectorMode((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition"
            >
              {projectorMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {projectorMode ? 'Thu gọn' : 'Chiếu bảng'}
            </button>
          </div>
        </div>

        <div className={`grid gap-5 ${projectorMode ? 'grid-cols-1' : 'lg:grid-cols-12'}`}>
          {!projectorMode && (
            <aside className="lg:col-span-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'TOAN', 'VAT_LY', 'HINH_HOC_3D'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSubjectFilter(tab)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                      subjectFilter === tab
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'ALL' ? 'Tất cả' : tab === 'TOAN' ? 'Toán học' : tab === 'VAT_LY' ? 'Vật Lý' : 'Hình 3D'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bài giảng Toán, Lý, 3D..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
                {visibleLessons.map((lesson) => {
                  const active = lesson.id === activeLesson.id;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setSelectedId(lesson.id)}
                      className={`w-full text-left rounded-2xl border p-3.5 transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-950/35 shadow-lg'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">
                        {lesson.subjectLabel}
                      </div>
                      <div className="text-sm font-bold text-white">{lesson.title}</div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lesson.summary}</p>
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          <main className={projectorMode ? 'col-span-1' : 'lg:col-span-8'}>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 space-y-4 shadow-2xl">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    {activeLesson.subjectLabel}
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">{activeLesson.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy('link')}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200"
                  >
                    {copiedType === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedType === 'link' ? 'Đã chép Link' : 'Chia sẻ Link lớp'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('embed')}
                    className="inline-flex items-center gap-1 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/40 px-3 py-1.5 text-xs font-bold text-indigo-200"
                  >
                    {copiedType === 'embed' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {copiedType === 'embed' ? 'Đã chép Mã' : 'Chép mã nhúng'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const md = `# ${activeLesson.title}\n\n${activeLesson.summary}\n\n## Nhiệm vụ khám phá\n- ${activeLesson.discoveryPrompt}\n\n${(activeLesson.spec.morphSteps || []).map((s) => `$$${s.latex}$$\n\n> ${s.note || ''}`).join('\n\n')}`;
                      localStorage.setItem('aegis-office-studio-draft-v1', JSON.stringify({ docKind: 'DOCX', title: activeLesson.title, markdown: md, sheets: [] }));
                      navigate('/office-studio');
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/40 px-3 py-1.5 text-xs font-bold text-sky-200"
                  >
                    <FileText className="h-3.5 w-3.5" /> Mở Office Studio
                  </button>
                </div>
              </div>

              <DynamicVisualWidget spec={activeLesson.spec} fullWidth />

              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Nhiệm vụ Khám phá Chủ động cho Học sinh
                  </div>
                  <p className="text-sm text-amber-100/90 mt-1">{activeLesson.discoveryPrompt}</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <InteractiveVisualStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        onInsertVisual={handleInsertCustomLesson}
      />
      <ProblemVisualImporterModal
        isOpen={importerOpen}
        onClose={() => setImporterOpen(false)}
        onLessonsGenerated={(generated) => {
          setLessons((prev) => [...generated, ...prev]);
          if (generated[0]) setSelectedId(generated[0].id);
        }}
      />
    </div>
  );
}
