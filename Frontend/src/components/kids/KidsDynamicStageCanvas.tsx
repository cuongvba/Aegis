import React, { useRef } from 'react';
import type { DynamicEpisodeScene, StageEntityItem } from './kidsStudioRegistry';

interface Props {
  scene: DynamicEpisodeScene;
  playerOverride?: { name: string; emoji: string; imageUrl?: string };
  selectedEntityId?: string | null;
  editable?: boolean;
  onSelectEntity?: (id: string) => void;
  onMoveEntity?: (id: string, x: number, y: number) => void;
}

const ANIM_CLASS: Record<StageEntityItem['animation'], string> = {
  idle: 'transition-transform duration-300',
  bounce: 'animate-bounce',
  fly: 'animate-pulse -translate-y-1',
  walk: 'animate-pulse',
  wave: 'animate-bounce',
};

const AMBIENT_PARTICLES: Record<string, string[]> = {
  clouds: ['☁️', '🌤️', '☁️'],
  stars: ['✨', '⭐', '🌟', '✨'],
  bubbles: ['🫧', '💧', '🫧'],
  petals: ['🌸', '🍃', '🌼'],
  rain: ['💧', '🌧️', '💧'],
};

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

  const particles = AMBIENT_PARTICLES[scene.ambientEffect] || [];

  // Layer ordering: PROP (10) -> SUPPORT (20) -> LEAD (30) -> HELPER (40)
  const ordered = [...scene.entities].sort((a, b) => {
    const rank = { PROP: 1, SUPPORT: 2, LEAD: 3, HELPER: 4 };
    return rank[a.role] - rank[b.role];
  });

  return (
    <div
      ref={boxRef}
      onClick={handleStageClick}
      className={`relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-inner border-4 border-white/80 bg-gradient-to-br ${scene.backdropGradient || 'from-sky-400 to-indigo-500'} ${editable && selectedEntityId ? 'cursor-crosshair' : ''}`}
    >
      {/* Layer 1: Backdrop Image or Video */}
      {scene.backdropVideoUrl ? (
        <video
          src={scene.backdropVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : scene.backdropImageUrl ? (
        <img src={scene.backdropImageUrl} alt="Backdrop" className="absolute inset-0 w-full h-full object-cover" />
      ) : null}

      {/* Layer 2: Ambient Effect Overlay */}
      {particles.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-75">
          {particles.map((p, idx) => (
            <span
              key={idx}
              style={{ left: `${15 + idx * 24}%`, top: `${10 + (idx % 2) * 18}%` }}
              className="absolute text-xl sm:text-2xl animate-pulse"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Layers 3-6: Props, Supporting, Lead (with Player Hero Override), Helpers */}
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
            onClick={(ev) => {
              ev.stopPropagation();
              onSelectEntity?.(ent.id);
            }}
            style={{ left: `${ent.x}%`, top: `${ent.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus:outline-none ${
              ent.role === 'PROP' ? 'z-10' : ent.role === 'SUPPORT' ? 'z-20' : ent.role === 'LEAD' ? 'z-30' : 'z-40'
            }`}
            title={`${displayName} (${ent.role})`}
          >
            {ent.speech && (
              <span className="mb-1 max-w-[140px] truncate rounded-xl bg-white/95 text-slate-900 px-2 py-0.5 text-[10px] font-black shadow-md">
                {ent.speech}
              </span>
            )}
            <div
              className={`rounded-2xl p-1 transition ${ANIM_CLASS[ent.animation]} ${
                isSelected ? 'ring-4 ring-amber-400 bg-white/25 scale-110' : ''
              } ${isLeadHero ? 'drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]' : ''}`}
            >
              {displayImg ? (
                <img src={displayImg} alt={displayName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-white shadow" />
              ) : (
                <span className={ent.role === 'LEAD' ? 'text-5xl sm:text-6xl drop-shadow-md' : ent.role === 'PROP' ? 'text-4xl' : 'text-4xl sm:text-5xl'}>
                  {displayEmoji}
                </span>
              )}
            </div>
            {(editable || isLeadHero) && (
              <span className="mt-0.5 px-1.5 py-0.2 rounded bg-black/50 text-[9px] font-bold text-white">
                {isLeadHero ? `🦸 ${displayName}` : displayName}
              </span>
            )}
          </button>
        );
      })}

      {/* Narration Subtitle Bar */}
      {scene.narration && (
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 rounded-2xl bg-black/45 backdrop-blur-sm px-3 py-1.5 text-center text-[11px] sm:text-xs font-bold text-white">
          {scene.narration}
        </div>
      )}
    </div>
  );
};
