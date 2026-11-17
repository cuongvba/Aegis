import { Check, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { playSynthGameSound } from './sound-effects';

interface MemoryFlipBoardProps {
  pairs: Array<{ left: string; right: string }>;
  matchingMap: Record<string, string>;
  onAssignPair: (leftItem: string, rightItem: string) => void;
  disabled?: boolean;
  soundEnabled?: boolean;
}

interface FlipCard {
  id: string;
  side: 'L' | 'R';
  value: string;
  pairIndex: number;
}

export function MemoryFlipBoard({
  pairs,
  matchingMap,
  onAssignPair,
  disabled,
  soundEnabled,
}: MemoryFlipBoardProps) {
  const cards = useMemo<FlipCard[]>(() => {
    const raw: FlipCard[] = [];
    pairs.forEach((p, idx) => {
      raw.push({ id: `L-${idx}`, side: 'L', value: p.left, pairIndex: idx });
      raw.push({ id: `R-${idx}`, side: 'R', value: p.right, pairIndex: idx });
    });
    // Xáo trộn ổn định theo độ dài nội dung để tránh nhảy layout khi re-render
    return raw.sort((a, b) => a.value.localeCompare(b.value) * (a.side === 'L' ? 1 : -1));
  }, [pairs]);

  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [mismatching, setMismatching] = useState(false);

  const isCardMatched = (card: FlipCard) => {
    if (card.side === 'L') return Boolean(matchingMap[card.value]);
    return Object.values(matchingMap).includes(card.value);
  };

  const handleFlip = (card: FlipCard) => {
    if (disabled || mismatching || isCardMatched(card) || flippedIds.includes(card.id)) return;
    playSynthGameSound('gem', Boolean(soundEnabled));

    if (flippedIds.length === 0) {
      setFlippedIds([card.id]);
      return;
    }

    const firstCard = cards.find((c) => c.id === flippedIds[0]);
    if (!firstCard) {
      setFlippedIds([card.id]);
      return;
    }

    const nextFlipped = [firstCard.id, card.id];
    setFlippedIds(nextFlipped);

    if (firstCard.pairIndex === card.pairIndex && firstCard.side !== card.side) {
      const leftItem = firstCard.side === 'L' ? firstCard.value : card.value;
      const rightItem = firstCard.side === 'R' ? firstCard.value : card.value;
      onAssignPair(leftItem, rightItem);
      setFlippedIds([]);
    } else {
      setMismatching(true);
      window.setTimeout(() => {
        setFlippedIds([]);
        setMismatching(false);
      }, 650);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => {
        const matched = isCardMatched(card);
        const revealed = matched || flippedIds.includes(card.id);
        return (
          <button
            key={card.id}
            type="button"
            disabled={disabled || matched}
            onClick={() => handleFlip(card)}
            className={`min-h-[88px] rounded-2xl border-2 p-3 text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
              matched
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-sm'
                : revealed
                ? 'border-sky-400 bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'border-indigo-200 bg-gradient-to-br from-indigo-500 to-sky-500 text-white hover:brightness-110 shadow'
            }`}
          >
            {revealed ? (
              <>
                {matched && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                <span className="text-xs sm:text-sm font-bold leading-snug">
                  <MathRenderer content={card.value} inline />
                </span>
              </>
            ) : (
              <Sparkles className="h-5 w-5 opacity-85" />
            )}
          </button>
        );
      })}
    </div>
  );
}
