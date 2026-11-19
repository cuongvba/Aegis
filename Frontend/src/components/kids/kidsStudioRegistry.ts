import type { KidAgeBand } from './kidsOfflineVault';

export type DynamicDomainCode = 'LANGUAGE' | 'NATURE_STEM' | 'SOCIAL_CULTURE' | 'SKILLS_CREATIVITY';
export type AmbientEffectType = 'none' | 'clouds' | 'rain' | 'sunbeams' | 'stars' | 'bubbles' | 'petals';
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
  dataUrl?: string;
  notes?: number[];
  gradient?: string;
  createdAt: string;
}

export interface StageEntityItem {
  id: string;
  role: 'LEAD' | 'SUPPORT' | 'HELPER' | 'PROP';
  name: string;
  emoji: string;
  imageUrl?: string;
  x: number;
  y: number;
  scale?: number; // 0.4 .. 2.2 (near/far depth)
  rotation?: number; // -180 .. 180 deg
  flipX?: boolean; // mirror horizontally
  animation: CharAnimationType;
  speech?: string;
}

export interface DynamicStageScene {
  id: string;
  sceneTitle: string;
  backdropGradient: string;
  backdropImageUrl?: string;
  backdropVideoUrl?: string;
  ambientEffect: AmbientEffectType;
  musicAssetId?: string;
  audioDataUrl?: string;
  narration: string;
  entities: StageEntityItem[];
}

export interface DynamicEpisode {
  id: string;
  episodeTitle: string;
  scenes: DynamicStageScene[];
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
  episodes: DynamicEpisode[];
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

const COURSES_KEY = 'aegis-kids-dynamic-courses-v2';
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
        scenes: [
          {
            id: 'sc-1-1',
            sceneTitle: 'Cảnh 1: Khu rừng buổi sáng',
            backdropGradient: 'from-emerald-400 via-lime-500 to-teal-600',
            ambientEffect: 'sunbeams',
            musicAssetId: 'mu-twinkle',
            narration: 'Buổi sáng nắng ấm chan hòa, bạn nhỏ Hero bước vào khu rừng để đánh thức những hạt mầm!',
            entities: [
              { id: 'e-lead', role: 'LEAD', name: 'Bạn Nhỏ Hero', emoji: '🦉', x: 35, y: 65, animation: 'bounce', speech: 'Chào buổi sáng khu rừng!' },
              { id: 'e-prop', role: 'PROP', name: 'Cây Cổ Thụ', emoji: '🌳', x: 16, y: 58, animation: 'idle' },
              { id: 'e-help', role: 'HELPER', name: 'Mặt Trời', emoji: '☀️', x: 84, y: 20, animation: 'fly', speech: 'Nắng ấm giúp cây lớn!' },
            ],
          },
          {
            id: 'sc-1-2',
            sceneTitle: 'Cảnh 2: Cơn mưa tưới mát',
            backdropGradient: 'from-sky-500 via-cyan-600 to-slate-700',
            ambientEffect: 'rain',
            narration: 'Mưa rơi tí tách tưới mát cho đất, giúp cây xanh quang hợp và nở hoa rực rỡ!',
            entities: [
              { id: 'e-lead-12', role: 'LEAD', name: 'Bạn Nhỏ Hero', emoji: '🦉', x: 45, y: 65, animation: 'wave', speech: 'Cơn mưa thật mát lành!' },
              { id: 'e-sup-12', role: 'SUPPORT', name: 'Thỏ Con', emoji: '🐰', x: 72, y: 68, animation: 'bounce', speech: 'Cây đang mọc mầm kìa!' },
              { id: 'e-prop-12', role: 'PROP', name: 'Mầm Xanh', emoji: '🌱', x: 24, y: 74, animation: 'idle' },
            ],
          },
        ],
        challengeQuestion: 'Cây xanh cần gì để tạo ra thức ăn (quang hợp)?',
        challengeOptions: ['Ánh nắng, nước và không khí', 'Chỉ cần bóng tối', 'Kẹo ngọt'],
        challengeCorrectIndex: 0,
      },
      {
        id: 'ep-2',
        episodeTitle: 'Tập 2: Ngọn Đuốc Anh Hùng',
        scenes: [
          {
            id: 'sc-2-1',
            sceneTitle: 'Cảnh 1: Bầu trời bình yên',
            backdropGradient: 'from-sky-400 via-cyan-300 to-indigo-500',
            ambientEffect: 'clouds',
            musicAssetId: 'mu-hero',
            narration: 'Mây trắng bồng bềnh trôi, muôn thú cùng chung tay bảo vệ dòng suối xanh!',
            entities: [
              { id: 'e-lead-2', role: 'LEAD', name: 'Bạn Nhỏ Hero', emoji: '🦉', x: 50, y: 55, animation: 'fly', speech: 'Cùng bảo vệ Trái Đất nhé!' },
              { id: 'e-prop-2', role: 'PROP', name: 'Lâu Đài Xanh', emoji: '🏰', x: 20, y: 58, animation: 'idle' },
              { id: 'e-sup-2', role: 'SUPPORT', name: 'Rồng Nhí', emoji: '🐉', x: 78, y: 54, animation: 'bounce' },
            ],
          },
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

export async function syncDynamicCoursesFromServer(): Promise<DynamicKidsCourseGame[]> {
  try {
    const resp = await fetch('/api/kids/dynamic-courses');
    if (!resp.ok) return getDynamicCourses();
    const rawItems = (await resp.json()) as string[];
    const remote = rawItems
      .map((s) => { try { return JSON.parse(s) as DynamicKidsCourseGame; } catch { return null; } })
      .filter((x): x is DynamicKidsCourseGame => Boolean(x && x.id && Array.isArray(x.episodes)));
    if (remote.length === 0) return getDynamicCourses();

    const local = getDynamicCourses();
    const byId = new Map<string, DynamicKidsCourseGame>();
    [...local, ...remote].forEach((c) => byId.set(c.id, c));
    const merged = Array.from(byId.values());
    writeStore(COURSES_KEY, merged);
    return merged;
  } catch {
    return getDynamicCourses();
  }
}

export async function pushDynamicCourseToServer(course: DynamicKidsCourseGame): Promise<boolean> {
  try {
    const resp = await fetch('/api/kids/dynamic-courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
