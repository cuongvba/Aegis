---
name: aegis-frontend-motion-craft
description: World-class UI, Design Systems, and 60fps Motion Craftsmanship for AegisGlobal (React 19, Tailwind v4, KaTeX, Canvas). Use when building or polishing any frontend page, component, animation, Visual Lab, Office Studio, Arena, or Sonic Studio UI.
---

# Aegis Frontend & 60fps Motion Craft

Synthesizes `emilkowalski/skills` motion precision and `anthropics/skills` frontend design standards into AegisGlobal's **Zero-Monolith** architecture.

## 1. Zero-Monolith & Bundle Discipline
- **File Size Cap**: Keep every UI component `<= 250` lines of code. Extract pure math/canvas/audio engines into `*.ts` helpers and sub-views into focused components.
- **Lazy Loading**: Route-level pages must load via `lazyRetry` / `React.lazy` + `Suspense` in [`App.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/App.tsx). Keep initial chunk `<= 150KB` gzip.
- **CLS = 0**: Reserve explicit aspect ratios (`aspect-video`, fixed header heights, skeleton dimensions) before async data or KaTeX math renders.

## 2. 60fps GPU-Only Motion Rules
- **Animate ONLY GPU-composited properties**: `transform` (`translate`, `scale`, `rotate`) and `opacity`. **Never** animate `width`, `height`, `top`, `left`, `margin`, or `padding`.
- **Precision Easing Curves**:
  - Entrances / UI drawers: `cubic-bezier(0.22, 1, 0.36, 1)` (`180ms–260ms`).
  - Micro-interactions (buttons, tabs, pills): `120ms–160ms` `ease-out`.
  - Exit transitions: slightly faster (`120ms–180ms`) than entrances.
- **Canvas & 3D Stages**: Run `requestAnimationFrame` loops cleanly with `cancelAnimationFrame` cleanup on unmount. Gate heavy effects behind `prefers-reduced-motion`.

## 3. Domain-Specific Visual Polish
- **KaTeX & Illustrations**: Never constrain raster `<img>` inside math/question containers to inline formula `em` heights; preserve natural aspect ratios.
- **Audio-Visual Feedback**: Pair state changes in interactive labs (Visual Lab, V-OS Sonic Studio, Arena) with crisp visual feedback (glow, active border, live indicator).
- **4-Tier i18n**: Route user-facing copy through `react-i18next` keys where established, with clean Vietnamese/English fallbacks.
