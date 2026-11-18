import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Check, Trash2 } from 'lucide-react';
import { kidsCurriculumService, KidsConceptAtom, KidsStageTheme } from '@/services/kidsCurriculum.service';

interface KidsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export const KidsReviewModal: React.FC<KidsReviewModalProps> = ({ isOpen, onClose, lang }) => {
  const [pendingAtoms, setPendingAtoms] = useState<KidsConceptAtom[]>([]);
  const [pendingStages, setPendingStages] = useState<KidsStageTheme[]>([]);
  const isVi = lang === 'vi';

  const loadPending = async () => {
    try {
      const [atoms, stages] = await Promise.all([
        kidsCurriculumService.getConceptAtoms(true),
        kidsCurriculumService.getStageThemes(true),
      ]);
      setPendingAtoms(atoms.filter((a) => a.status === 'PENDING_REVIEW'));
      setPendingStages(stages.filter((s) => s.status === 'PENDING_REVIEW'));
    } catch {}
  };

  useEffect(() => {
    if (isOpen) loadPending();
  }, [isOpen]);

  if (!isOpen) return null;

  const moderate = async (code: string, approve: boolean) => {
    await kidsCurriculumService.moderateContribution(code, approve);
    await loadPending();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl space-y-4">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {isVi ? 'Cổng Kiểm Duyệt An Toàn Trẻ Em (Giáo viên / Phụ huynh)' : 'Child-Safe Contribution Review'}
            </h3>
            <p className="text-xs text-slate-400">
              {isVi ? 'Duyệt các sân khấu và câu chuyện do học sinh cấp trên đóng góp trước khi hiển thị cho các bé' : 'Approve youth-created stages and stories before publishing to kids'}
            </p>
          </div>
        </div>

        {pendingStages.length === 0 && pendingAtoms.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            {isVi ? 'Hiện không có tác phẩm nào đang chờ duyệt.' : 'No pending contributions right now.'}
          </p>
        ) : (
          <div className="space-y-3 text-xs">
            {pendingStages.map((st) => (
              <div key={st.stageCode} className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">SÂN KHẤU</span>
                  <h4 className="text-sm font-black text-white mt-1">{st.badgeEmoji} {st.titleVi}</h4>
                  <p className="text-slate-400">Tác giả: {st.authorName} {st.authorClass ? `(${st.authorClass})` : ''}</p>
                  {st.creatorDream && <p className="text-amber-300 italic mt-0.5">"{st.creatorDream}"</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => moderate(st.stageCode, true)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1"><Check size={13} /> Duyệt</button>
                  <button type="button" onClick={() => moderate(st.stageCode, false)} className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold inline-flex items-center gap-1"><Trash2 size={13} /> Từ chối</button>
                </div>
              </div>
            ))}

            {pendingAtoms.map((atom) => (
              <div key={atom.atomCode} className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">BÀI HỌC / TRUYỆN</span>
                  <h4 className="text-sm font-black text-white">{atom.emoji} {atom.secondaryText} ({atom.primaryText})</h4>
                  <p className="text-slate-300">{atom.sampleSentenceVi}</p>
                  <p className="text-slate-400">Tác giả: {atom.authorName} {atom.authorClass ? `(${atom.authorClass})` : ''}</p>
                  {atom.voiceAudioUrl && <audio src={atom.voiceAudioUrl} controls className="h-8 mt-1" />}
                  {atom.imageUrl && <img src={atom.imageUrl} alt={atom.secondaryText} className="max-h-24 rounded-lg border border-slate-700 mt-1" />}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => moderate(atom.atomCode, true)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1"><Check size={13} /> Duyệt</button>
                  <button type="button" onClick={() => moderate(atom.atomCode, false)} className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold inline-flex items-center gap-1"><Trash2 size={13} /> Từ chối</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
