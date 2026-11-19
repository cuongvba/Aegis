import React, { useRef } from 'react';
import type { DynamicStageScene, StageEntityItem } from './kidsStudioRegistry';

interface Props {
  scene: DynamicStageScene;
  playerOverride?: { name: string; emoji: string; imageUrl?: string };
  selectedEntityId?: string | null;
  editable?: boolean;
  onSelectEntity?: (id: string) => void;
  onMoveEntity?: (id: string, x: number, y: number) => void;
}

const ANIM_CLASS: Record<StageEntityItem['animation'], string> = {
  idle: 'transition-transform duration-300',
  bounce: 'animate-bounce',
  fly: 'aegis-anim-float',
  walk: 'animate-pulse',
  wave: 'animate-bounce',
};

const STAGE_KEYFRAMES = `
@keyframes aegisDriftRight { 0% { transform: translateX(-15%); } 100% { transform: translateX(115%); } }
@keyframes aegisFallDown { 0% { transform: translateY(-20%) translateX(0); opacity: 0.9; } 100% { transform: translateY(320px) translateX(-18px); opacity: 0.2; } }
@keyframes aegisRiseUp { 0% { transform: translateY(240px) scale(0.8); opacity: 0.85; } 100% { transform: translateY(-30px) scale(1.2); opacity: 0.1; } }
@keyframes aegisSpinSlow { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.08); } 100% { transform: rotate(360deg) scale(1); } }
@keyframes aegisFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
.aegis-anim-float { animation: aegisFloat 2.4s ease-in-out infinite; }
`;

export const KidsDynamicStageCanvas: React.FC<Props> = ({
  scene,
  playerOverride,
  selectedEntityId,
  editable = false,
  onSelectEntity,
  onMoveEntity,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || !selectedEntityId || !onMoveEntity || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(92, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(12, Math.min(88, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    onMoveEntity(selectedEntityId, x, y);
  };

  const ordered = [...scene.entities].sort((a, b) => {
    const rank = { PROP: 1, SUPPORT: 2, LEAD: 3, HELPER: 4 };
    return rank[a.role] - rank[b.role];
  });

  const renderAmbientLayer = () => {
    if (scene.ambientEffect === 'clouds') {
      return [0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            top: `${8 + i * 15}%`,
            left: '0%',
            width: '100%',
            animation: `aegisDriftRight ${10 + i * 3}s linear ${-i * 2.5}s infinite`,
          }}
          className="absolute text-3xl sm:text-4xl opacity-80"
        >
          ☁️
        </span>
      ));
    }
    if (scene.ambientEffect === 'rain') {
      return Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          style={{
            left: `${6 + i * 9}%`,
            top: '-10%',
            animation: `aegisFallDown ${1.2 + (i % 3) * 0.4}s linear ${-(i * 0.25)}s infinite`,
          }}
          className="absolute text-lg opacity-80"
        >
          💧
        </span>
      ));
    }
    if (scene.ambientEffect === 'sunbeams') {
      return (
        <div className="absolute -top-8 -right-8 flex items-center justify-center pointer-events-none">
          <div
            style={{ animation: 'aegisSpinSlow 16s linear infinite' }}
            className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-300/50 via-amber-200/20 to-transparent blur-sm flex items-center justify-center text-6xl"
          >
            ☀️
          </div>
        </div>
      );
    }
    if (scene.ambientEffect === 'bubbles') {
      return Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          style={{ left: `${10 + i * 13}%`, animation: `aegisRiseUp ${3 + (i % 3)}s ease-in ${-i * 0.7}s infinite` }}
          className="absolute text-xl opacity-80"
        >
          🫧
        </span>
      ));
    }
    if (scene.ambientEffect === 'petals') {
      return Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          style={{ left: `${8 + i * 13}%`, top: '-8%', animation: `aegisFallDown ${3.2 + (i % 3) * 0.7}s linear ${-i * 0.6}s infinite` }}
          className="absolute text-xl opacity-85"
        >
          {i % 2 === 0 ? '🌸' : '🍃'}
        </span>
      ));
    }
    if (scene.ambientEffect === 'stars') {
      return Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          style={{ left: `${8 + i * 11}%`, top: `${10 + (i % 3) * 18}%` }}
          className="absolute text-xl animate-pulse"
        >
          {i % 2 === 0 ? '✨' : '⭐'}
        </span>
      ));
    }
    return null;
  };

  return (
    <div
      ref={boxRef}
      onClick={handleStageClick}
      className={`relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-inner border-4 border-white/80 bg-gradient-to-br ${scene.backdropGradient || 'from-sky-400 to-indigo-500'} ${editable && selectedEntityId ? 'cursor-crosshair' : ''}`}
    >
      <style>{STAGE_KEYFRAMES}</style>

      {scene.backdropVideoUrl ? (
        <video src={scene.backdropVideoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : scene.backdropImageUrl ? (
        <img src={scene.backdropImageUrl} alt="Backdrop" className="absolute inset-0 w-full h-full object-cover" />
      ) : null}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">{renderAmbientLayer()}</div>

      {ordered.map((ent) => {
        const isLeadHero = ent.role === 'LEAD' && playerOverride;
        const displayEmoji = isLeadHero ? playerOverride.emoji : ent.emoji;
        const displayImg = isLeadHero ? playerOverride.imageUrl : ent.imageUrl;
        const displayName = isLeadHero ? playerOverride.name : ent.name;
        const isSelected = editable && selectedEntityId === ent.id;

        return (
          <button
            key={ent.id}
            type="button"
            onClick={(ev) => { ev.stopPropagation(); onSelectEntity?.(ent.id); }}
            style={{ left: `${ent.x}%`, top: `${ent.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center focus:outline-none ${
              ent.role === 'PROP' ? 'z-10' : ent.role === 'SUPPORT' ? 'z-20' : ent.role === 'LEAD' ? 'z-30' : 'z-40'
            }`}
          >
            {ent.speech && (
              <span className="mb-1 max-w-[140px] truncate rounded-xl bg-white/95 text-slate-900 px-2 py-0.5 text-[10px] font-black shadow-md">
                {ent.speech}
              </span>
            )}
            <div className={`rounded-2xl p-1 transition ${ANIM_CLASS[ent.animation]} ${isSelected ? 'ring-4 ring-amber-400 bg-white/25 scale-110' : ''} ${isLeadHero ? 'drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]' : ''}`}>
              {displayImg ? (
                <img src={displayImg} alt={displayName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-white shadow" />
              ) : (
                <span className={ent.role === 'LEAD' ? 'text-5xl sm:text-6xl drop-shadow-md' : 'text-4xl'}>{displayEmoji}</span>
              )}
            </div>
            {(editable || isLeadHero) && (
              <span className="mt-0.5 px-1.5 rounded bg-black/50 text-[9px] font-bold text-white">
                {isLeadHero ? `🦸 ${displayName}` : displayName}
              </span>
            )}
          </button>
        );
      })}

      {scene.narration && (
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 rounded-2xl bg-black/45 backdrop-blur-sm px-3 py-1.5 text-center text-[11px] sm:text-xs font-bold text-white">
          {scene.narration}
        </div>
      )}
    </div>
  );
};
