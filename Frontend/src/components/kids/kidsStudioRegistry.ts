import type { KidAgeBand } from './kidsOfflineVault';

export type DynamicDomainCode = 'LANGUAGE' | 'NATURE_STEM' | 'SOCIAL_CULTURE' | 'SKILLS_CREATIVITY';
export type AmbientEffectType = 'none' | 'clouds' | 'stars' | 'bubbles' | 'petals' | 'rain';
export type CharAnimationType = 'idle' | 'bounce' | 'fly' | 'walk' | 'wave';
export type AssetKind = 'BACKDROP' | 'CHARACTER' | 'PROP' | 'VIDEO' | 'MUSIC' | 'AUDIO';

export interface DynamicDomainDef {
  code: DynamicDomainCode;
  emoji: string;
  labelVi: string;
  labelEn: string;
}

export interface StudioAssetItem {
  id: string;
  kind: AssetKind;
  name: string;
  emoji?: string;
  dataUrl?: string; // Image, SVG, Video, Audio, or Music base64
  notes?: number[]; // For 8-note synth music presets
  gradient?: string;
  createdAt: string;
}

export interface StageEntityItem {
  id: string;
  role: 'LEAD' | 'SUPPORT' | 'HELPER' | 'PROP';
  name: string;
  emoji: string;
  imageUrl?: string;
  x: number; // 10..90 %
  y: number; // 15..85 %
  animation: CharAnimationType;
  speech?: string;
}

export interface DynamicEpisodeScene {
  id: string;
  episodeTitle: string;
  backdropGradient: string;
  backdropImageUrl?: string;
  backdropVideoUrl?: string;
  ambientEffect: AmbientEffectType;
  musicAssetId?: string;
  audioDataUrl?: string;
  narration: string;
  entities: StageEntityItem[];
  challengeQuestion?: string;
  challengeOptions?: string[];
  challengeCorrectIndex?: number;
}

export interface DynamicKidsCourseGame {
  id: string;
  domainCode: DynamicDomainCode;
  title: string;
  ageBand: KidAgeBand;
  isGameMode: boolean;
  heroBadgeTitle: string;
  episodes: DynamicEpisodeScene[];
  createdAt: string;
}

export interface HeroBadgeRecord {
  id: string;
  gameId: string;
  gameTitle: string;
  heroName: string;
  heroAvatar: string;
  heroImageUrl?: string;
  badgeTitle: string;
  completedAt: string;
}

const COURSES_KEY = 'aegis-kids-dynamic-courses-v1';
const ASSETS_KEY = 'aegis-kids-dynamic-assets-v1';
const HEROES_KEY = 'aegis-kids-hall-of-heroes-v1';

export const DYNAMIC_DOMAINS: DynamicDomainDef[] = [
  { code: 'LANGUAGE', emoji: '🗣️', labelVi: 'Học Ngôn Ngữ', labelEn: 'Language' },
  { code: 'NATURE_STEM', emoji: '🌿', labelVi: 'Học Tự Nhiên & STEM', labelEn: 'Nature & STEM' },
  { code: 'SOCIAL_CULTURE', emoji: '🏛️', labelVi: 'Học Xã Hội & Văn Hóa', labelEn: 'Social & Culture' },
  { code: 'SKILLS_CREATIVITY', emoji: '🧭', labelVi: 'Khám Phá Kỹ Năng', labelEn: 'Life Skills' },
];

const DEFAULT_ASSETS: StudioAssetItem[] = [
  { id: 'bg-sky', kind: 'BACKDROP', name: 'Bầu Trời Xanh', emoji: '☁️', gradient: 'from-sky-400 via-cyan-300 to-indigo-500', createdAt: '' },
  { id: 'bg-ocean', kind: 'BACKDROP', name: 'Đại Dương Sâu', emoji: '🌊', gradient: 'from-cyan-500 via-teal-600 to-blue-800', createdAt: '' },
  { id: 'bg-fairy', kind: 'BACKDROP', name: 'Rừng Cổ Tích', emoji: '🧚', gradient: 'from-fuchsia-500 via-purple-600 to-indigo-800', createdAt: '' },
  { id: 'bg-meadow', kind: 'BACKDROP', name: 'Thảo Nguyên Nắng', emoji: '🌿', gradient: 'from-emerald-400 via-lime-500 to-teal-600', createdAt: '' },
  { id: 'bg-space', kind: 'BACKDROP', name: 'Vũ Trụ Sao', emoji: '🚀', gradient: 'from-slate-900 via-indigo-950 to-purple-950', createdAt: '' },
  { id: 'ch-owl', kind: 'CHARACTER', name: 'Cú Mèo Thông Thái', emoji: '🦉', createdAt: '' },
  { id: 'ch-dragon', kind: 'CHARACTER', name: 'Rồng Nhí Lạc Hồng', emoji: '🐉', createdAt: '' },
  { id: 'ch-lion', kind: 'CHARACTER', name: 'Sư Tử Dũng Cảm', emoji: '🦁', createdAt: '' },
  { id: 'ch-unicorn', kind: 'CHARACTER', name: 'Kỳ Lân Ánh Sao', emoji: '🦄', createdAt: '' },
  { id: 'ch-astronaut', kind: 'CHARACTER', name: 'Phi Hành Gia Nhí', emoji: '🧑‍🚀', createdAt: '' },
  { id: 'pr-tree', kind: 'PROP', name: 'Cây Cổ Thụ', emoji: '🌳', createdAt: '' },
  { id: 'pr-castle', kind: 'PROP', name: 'Lâu Đài', emoji: '🏰', createdAt: '' },
  { id: 'pr-drum', kind: 'PROP', name: 'Trống Đồng', emoji: '🥁', createdAt: '' },
  { id: 'pr-book', kind: 'PROP', name: 'Sách Phép Thuật', emoji: '📖', createdAt: '' },
  { id: 'mu-twinkle', kind: 'MUSIC', name: 'Giai điệu Ánh Sao (Synth)', emoji: '🎵', notes: [261.6, 261.6, 392, 392, 440, 440, 392], createdAt: '' },
  { id: 'mu-hero', kind: 'MUSIC', name: 'Hành Khúc Anh Hùng (Synth)', emoji: '🎺', notes: [293.6, 349.2, 440, 523.2, 587.3], createdAt: '' },
];

const DEFAULT_COURSES: DynamicKidsCourseGame[] = [
  {
    id: 'game-hero-nature',
    domainCode: 'NATURE_STEM',
    title: 'Hành Trình Giải Cứu Rừng Xanh (2 Tập)',
    ageBand: '6-8',
    isGameMode: true,
    heroBadgeTitle: 'Vệ Binh Rừng Xanh',
    createdAt: new Date().toISOString(),
    episodes: [
      {
        id: 'ep-1',
        episodeTitle: 'Tập 1: Bí Mật Của Hạt Mầm',
        backdropGradient: 'from-emerald-400 via-lime-500 to-teal-600',
        ambientEffect: 'petals',
        musicAssetId: 'mu-twinkle',
        narration: 'Chào mừng người hùng nhỏ! Cây xanh cần ánh nắng và nước sạch để quang hợp và lớn lên.',
        entities: [
          { id: 'e-lead', role: 'LEAD', name: 'Bạn Nhỏ Hero', emoji: '🦉', x: 38, y: 62, animation: 'bounce', speech: 'Mình sẽ chăm sóc khu rừng!' },
          { id: 'e-sup', role: 'SUPPORT', name: 'Thỏ Con', emoji: '🐰', x: 68, y: 66, animation: 'wave', speech: 'Cảm ơn bạn đã tưới nước!' },
          { id: 'e-prop', role: 'PROP', name: 'Cây Cổ Thụ', emoji: '🌳', x: 18, y: 55, animation: 'idle' },
          { id: 'e-help', role: 'HELPER', name: 'Mặt Trời', emoji: '☀️', x: 82, y: 22, animation: 'fly', speech: 'Quang hợp = Nắng + Nước!' },
        ],
        challengeQuestion: 'Cây xanh cần gì để tạo ra thức ăn (quang hợp)?',
        challengeOptions: ['Ánh nắng, nước và không khí', 'Chỉ cần bóng tối', 'Kẹo ngọt'],
        challengeCorrectIndex: 0,
      },
      {
        id: 'ep-2',
        episodeTitle: 'Tập 2: Ngọn Đuốc Anh Hùng',
        backdropGradient: 'from-sky-400 via-cyan-300 to-indigo-500',
        ambientEffect: 'stars',
        musicAssetId: 'mu-hero',
        narration: 'Tuyệt vời! Bạn đã bảo vệ dòng suối mát lành cho muôn thú. Trả lời thử thách cuối để trở thành Hero!',
        entities: [
          { id: 'e-lead-2', role: 'LEAD', name: 'Bạn Nhỏ Hero', emoji: '🦉', x: 50, y: 55, animation: 'fly', speech: 'Cùng bảo vệ Trái Đất nhé!' },
          { id: 'e-prop-2', role: 'PROP', name: 'Lâu Đài Xanh', emoji: '🏰', x: 20, y: 58, animation: 'idle' },
          { id: 'e-sup-2', role: 'SUPPORT', name: 'Rồng Nhí', emoji: '🐉', x: 78, y: 54, animation: 'bounce' },
        ],
        challengeQuestion: 'Hành động nào giúp bảo vệ môi trường?',
        challengeOptions: ['Trồng cây và bỏ rác đúng nơi quy định', 'Xả rác xuống sông'],
        challengeCorrectIndex: 0,
      },
    ],
  },
];

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

export function getDynamicCourses(): DynamicKidsCourseGame[] {
  const custom = readStore<DynamicKidsCourseGame[]>(COURSES_KEY, []);
  return custom.length > 0 ? custom : DEFAULT_COURSES;
}

export function saveDynamicCourse(course: DynamicKidsCourseGame): DynamicKidsCourseGame[] {
  const list = getDynamicCourses();
  const next = [course, ...list.filter((c) => c.id !== course.id)];
  writeStore(COURSES_KEY, next);
  return next;
}

export function getStudioAssets(kind?: AssetKind): StudioAssetItem[] {
  const custom = readStore<StudioAssetItem[]>(ASSETS_KEY, []);
  const merged = [...custom, ...DEFAULT_ASSETS];
  return kind ? merged.filter((a) => a.kind === kind) : merged;
}

export function saveStudioAsset(asset: StudioAssetItem): StudioAssetItem[] {
  const custom = readStore<StudioAssetItem[]>(ASSETS_KEY, []);
  const next = [asset, ...custom.filter((a) => a.id !== asset.id)];
  writeStore(ASSETS_KEY, next);
  return getStudioAssets();
}

export function getHallOfHeroes(): HeroBadgeRecord[] {
  return readStore<HeroBadgeRecord[]>(HEROES_KEY, []);
}

export function recordHeroAscension(badge: HeroBadgeRecord): HeroBadgeRecord[] {
  const list = getHallOfHeroes();
  const next = [badge, ...list.filter((b) => !(b.gameId === badge.gameId && b.heroName === badge.heroName))];
  writeStore(HEROES_KEY, next);
  return next;
}
