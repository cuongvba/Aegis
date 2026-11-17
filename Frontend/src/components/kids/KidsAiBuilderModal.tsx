import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { kidsCurriculumService } from '@/services/kidsCurriculum.service';

interface KidsAiBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuiltAndPlay: (islandId: string, ageBand: string) => void;
  lang: string;
}

export const KidsAiBuilderModal: React.FC<KidsAiBuilderModalProps> = ({
  isOpen,
  onClose,
  onBuiltAndPlay,
  lang,
}) => {
  const [topicTitle, setTopicTitle] = useState('');
  const [islandId, setIslandId] = useState('explore');
  const [ageBand, setAgeBand] = useState('6-8');
  const [itemCount, setItemCount] = useState(4);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;
  const isVi = lang === 'vi';

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;
    setIsBuilding(true);
    setError(null);
    try {
      await kidsCurriculumService.buildCurriculumWithAi({
        topicTitle: topicTitle.trim(),
        islandId,
        ageBand,
        itemCount,
      });
      onBuiltAndPlay(islandId, ageBand);
      onClose();
    } catch {
      setError(isVi ? 'Không tạo được chương trình lúc này.' : 'Unable to generate curriculum right now.');
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {isVi ? 'AI Tự Động Tạo Chương Trình Cho Bé' : 'AI Kids Curriculum Genesis'}
            </h3>
            <p className="text-xs text-slate-400">
              {isVi ? 'Nhập chủ đề bất kỳ để sinh Hạt nhân Tri thức & Trò chơi 4 bước' : 'Enter any topic to auto-synthesize Concept Atoms & 4-step games'}
            </p>
          </div>
        </div>

        <form onSubmit={handleBuild} className="space-y-3 text-xs">
          <input
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            placeholder={isVi ? 'VD: Khủng long kỷ Jura, Vũ trụ, Động vật biển...' : 'e.g. Dinosaurs, Solar System, Ocean Animals...'}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
          />

          <div className="grid grid-cols-3 gap-2">
            <select value={islandId} onChange={(e) => setIslandId(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-white">
              <option value="english">🦁 English</option>
              <option value="math">🧮 Math</option>
              <option value="science">🚀 Science</option>
              <option value="explore">🌈 Explore</option>
            </select>
            <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-white">
              <option value="3-5">{isVi ? '3–5 tuổi' : 'Ages 3–5'}</option>
              <option value="6-8">{isVi ? '6–8 tuổi' : 'Ages 6–8'}</option>
              <option value="9-11">{isVi ? '9–11 tuổi' : 'Ages 9–11'}</option>
            </select>
            <input
              type="number"
              min={2}
              max={6}
              value={itemCount}
              onChange={(e) => setItemCount(Math.max(2, Math.min(6, Number(e.target.value) || 4)))}
              className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-center font-bold text-cyan-300"
            />
          </div>

          {error && <p className="text-rose-400 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={isBuilding || !topicTitle.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"
          >
            {isBuilding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isBuilding ? (isVi ? 'AI đang kiến tạo bài học...' : 'Synthesizing...') : (isVi ? 'Sinh Chương Trình & Chơi Ngay' : 'Generate & Play Now')}
          </button>
        </form>
      </div>
    </div>
  );
};
