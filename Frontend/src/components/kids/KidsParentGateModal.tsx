import React, { useMemo, useState } from 'react';
import { Lock, X } from 'lucide-react';

interface KidsParentGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  t: (key: string) => string;
}

export const KidsParentGateModal: React.FC<KidsParentGateModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
  t,
}) => {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const challenge = useMemo(() => {
    const a = 6 + (Date.now() % 4);
    const b = 5 + ((Date.now() >> 2) % 5);
    return { a, b, sum: a + b };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(answer.trim()) === challenge.sum) {
      setAnswer('');
      setError(false);
      onUnlocked();
      return;
    }
    setError(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-4 border-amber-300 text-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
            <Lock size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">{t('kidsParentGateTitle')}</h3>
            <p className="text-xs text-slate-500">{t('kidsParentGateSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-4 text-center text-2xl font-black text-amber-800">
            {challenge.a} + {challenge.b} = ?
          </div>
          <input
            type="number"
            autoFocus
            value={answer}
            onChange={(e) => { setAnswer(e.target.value); setError(false); }}
            placeholder={t('kidsParentGatePlaceholder')}
            className="w-full rounded-2xl border-2 border-slate-300 px-4 py-3 text-center text-lg font-black focus:border-amber-500 focus:outline-none"
          />
          {error && <p className="text-xs font-bold text-rose-600 text-center">{t('kidsParentGateError')}</p>}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-black text-white shadow-md hover:brightness-105 transition"
          >
            {t('kidsParentGateUnlock')}
          </button>
        </form>
      </div>
    </div>
  );
};
