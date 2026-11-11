/**
 * Gameshow Theme Registry (OCP-Compliant)
 * ==============================================================
 * Tuân thủ Open-Closed Principle: Cho phép mở rộng đăng ký theme/layout
 * cho các format gameshow mới mà không sửa đổi mã nguồn GameshowCard.
 */

export interface GameshowVisualTheme {
  gradient: string;
  borderColor: string;
  glowColor: string;
  accentText: string;
}

const DEFAULT_THEME: GameshowVisualTheme = {
  gradient: 'from-slate-950/40 via-slate-900/90 to-cyan-950/20',
  borderColor: 'border-cyan-500/30 hover:border-cyan-400',
  glowColor: 'bg-cyan-500/10',
  accentText: 'text-cyan-400',
};

const THEME_MAP = new Map<string, GameshowVisualTheme>([
  [
    'OLYMPIA',
    {
      gradient: 'from-amber-950/30 via-slate-900/90 to-yellow-950/20',
      borderColor: 'border-amber-500/30 hover:border-amber-400',
      glowColor: 'bg-amber-500/10',
      accentText: 'text-amber-400',
    },
  ],
  [
    'WHEEL',
    {
      gradient: 'from-purple-950/30 via-slate-900/90 to-pink-950/20',
      borderColor: 'border-purple-500/30 hover:border-pink-400',
      glowColor: 'bg-pink-500/10',
      accentText: 'text-pink-400',
    },
  ],
  [
    'UNIVERSITY',
    {
      gradient: 'from-blue-950/30 via-slate-900/90 to-cyan-950/20',
      borderColor: 'border-blue-500/30 hover:border-cyan-400',
      glowColor: 'bg-blue-500/10',
      accentText: 'text-cyan-400',
    },
  ],
  [
    'JEOPARDY',
    {
      gradient: 'from-indigo-950/30 via-slate-900/90 to-blue-950/20',
      borderColor: 'border-indigo-500/30 hover:border-indigo-400',
      glowColor: 'bg-indigo-500/10',
      accentText: 'text-indigo-400',
    },
  ],
  [
    'LIGHTNING',
    {
      gradient: 'from-rose-950/30 via-slate-900/90 to-orange-950/20',
      borderColor: 'border-rose-500/30 hover:border-orange-400',
      glowColor: 'bg-rose-500/10',
      accentText: 'text-orange-400',
    },
  ],
  [
    'GOLDEN_BELL',
    {
      gradient: 'from-yellow-950/30 via-slate-900/90 to-amber-950/20',
      borderColor: 'border-yellow-500/30 hover:border-yellow-400',
      glowColor: 'bg-yellow-500/10',
      accentText: 'text-yellow-300',
    },
  ],
  [
    'TRIEU_PHU_AI',
    {
      gradient: 'from-blue-950/40 via-slate-900/90 to-indigo-950/30',
      borderColor: 'border-blue-400/40 hover:border-blue-300',
      glowColor: 'bg-blue-400/15',
      accentText: 'text-blue-300',
    },
  ],
  [
    'THE_CHASE',
    {
      gradient: 'from-red-950/40 via-slate-900/90 to-rose-950/30',
      borderColor: 'border-red-500/40 hover:border-red-400',
      glowColor: 'bg-red-500/15',
      accentText: 'text-red-400',
    },
  ],
]);

export function getGameshowTheme(code?: string): GameshowVisualTheme {
  if (!code) return DEFAULT_THEME;
  return THEME_MAP.get(code.toUpperCase()) || DEFAULT_THEME;
}

export function registerGameshowTheme(code: string, theme: GameshowVisualTheme): void {
  THEME_MAP.set(code.toUpperCase(), theme);
}

