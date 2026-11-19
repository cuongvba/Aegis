import type { KidsLessonPlan } from '@/services/kidsCurriculum.service';

export type KidAgeBand = '3-5' | '6-8' | '9-11';

export interface KidProfile {
  id: string;
  name: string;
  avatar: string;
  ageBand: KidAgeBand;
  stars: number;
}

export interface KidStoryScene {
  id: string;
  bgKey: 'sky' | 'ocean' | 'fairy' | 'meadow' | 'space';
  sticker: string;
  caption: string;
  audioDataUrl?: string;
}

export interface KidCreationItem {
  id: string;
  profileId: string;
  title: string;
  ageBand: KidAgeBand;
  category: 'STORY' | 'MUSIC' | 'STEM' | 'CULTURE';
  scenes: KidStoryScene[];
  createdAt: string;
  synced: boolean;
}

const PROFILES_KEY = 'aegis-kids-profiles-v1';
const ACTIVE_PROFILE_KEY = 'aegis-kids-active-profile-v1';
const CREATIONS_KEY = 'aegis-kids-creations-v1';
const CARTRIDGE_KEY = 'aegis-kids-offline-cartridge-v1';
const IDB_NAME = 'aegis-kids-offline-db';
const IDB_STORE = 'kv';

const DEFAULT_PROFILES: KidProfile[] = [
  { id: 'kid-default', name: 'Bé Khám Phá', avatar: '🦉', ageBand: '6-8', stars: 0 },
];

export function isLowSpecDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  return Boolean((mem && mem <= 2) || conn?.saveData);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeIdbBackup(key: string, value: unknown): void {
  if (typeof indexedDB === 'undefined') return;
  try {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      const tx = req.result.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
    };
  } catch { /* ignore */ }
}

function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore quota */ }
  writeIdbBackup(key, value);
}

export function getKidProfiles(): KidProfile[] {
  const list = readJson<KidProfile[]>(PROFILES_KEY, []);
  return list.length > 0 ? list : DEFAULT_PROFILES;
}

export function getActiveKidProfile(): KidProfile {
  const list = getKidProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
  return list.find((p) => p.id === activeId) || list[0];
}

export function setActiveKidProfile(profileId: string): KidProfile {
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  return getActiveKidProfile();
}

export function upsertKidProfile(profile: KidProfile): KidProfile[] {
  const list = getKidProfiles();
  const idx = list.findIndex((p) => p.id === profile.id);
  const next = idx >= 0 ? list.map((p, i) => (i === idx ? profile : p)) : [...list, profile];
  saveJson(PROFILES_KEY, next);
  return next;
}

export function getKidCreations(profileId?: string): KidCreationItem[] {
  const all = readJson<KidCreationItem[]>(CREATIONS_KEY, []);
  return profileId ? all.filter((c) => c.profileId === profileId) : all;
}

export function saveKidCreation(item: KidCreationItem): KidCreationItem[] {
  const all = readJson<KidCreationItem[]>(CREATIONS_KEY, []);
  const next = [item, ...all.filter((c) => c.id !== item.id)];
  saveJson(CREATIONS_KEY, next);
  return next;
}

export function saveOfflineLessonCartridge(kingdomId: string, plan: KidsLessonPlan): void {
  const map = readJson<Record<string, KidsLessonPlan>>(CARTRIDGE_KEY, {});
  map[kingdomId] = plan;
  saveJson(CARTRIDGE_KEY, map);
}

export function getOfflineFallbackLesson(kingdomId: string, ageBand: string): KidsLessonPlan {
  const map = readJson<Record<string, KidsLessonPlan>>(CARTRIDGE_KEY, {});
  if (map[kingdomId]) return map[kingdomId];

  return {
    lessonId: `offline-${kingdomId}-${ageBand}`,
    islandId: kingdomId,
    ageBand,
    atomCount: 2,
    activityCount: 2,
    atoms: [
      {
        atomCode: 'offline-star',
        islandId: kingdomId,
        ageBand,
        order: 1,
        primaryText: 'Ngôi Sao Hy Vọng',
        secondaryText: 'Star of Hope',
        emoji: '🌟',
        sampleSentenceVi: 'Đây là Ngôi Sao Hy Vọng. Dù ở nơi xa xôi không có mạng, tri thức vẫn tỏa sáng!',
        sampleSentenceEn: 'This is the Star of Hope. Knowledge shines everywhere!',
        funFactVi: 'Ánh sáng từ Mặt Trời mất khoảng 8 phút để tới Trái Đất.',
        funFactEn: 'Sunlight takes about 8 minutes to reach Earth.',
        numericValue: 3,
        isAiGenerated: false,
      },
      {
        atomCode: 'offline-elephant',
        islandId: kingdomId,
        ageBand,
        order: 2,
        primaryText: 'Chú Voi Bản Đôn',
        secondaryText: 'Friendly Elephant',
        emoji: '🐘',
        sampleSentenceVi: 'Chú Voi có chiếc vòi rất khỏe để uống nước và giúp đỡ bạn bè trong rừng!',
        sampleSentenceEn: 'The friendly elephant uses its trunk to drink water and help friends!',
        funFactVi: 'Voi là loài động vật trên cạn có trí nhớ rất tốt.',
        funFactEn: 'Elephants have amazing memories.',
        numericValue: 4,
        isAiGenerated: false,
      },
    ],
    activities: [
      {
        activityId: 'off-act-1',
        atomCode: 'offline-star',
        activityType: 'INTERACT_COUNT',
        titleVi: 'Đếm Ngôi Sao',
        titleEn: 'Count Stars',
        promptVi: 'Bé hãy chạm đếm đủ 3 Ngôi Sao nhé!',
        promptEn: 'Tap to count 3 Stars!',
        speechTextVi: 'Bé hãy chạm đếm đủ 3 Ngôi Sao nhé!',
        speechTextEn: 'Tap to count 3 Stars!',
        emoji: '🌟',
        primaryText: 'Ngôi Sao',
        secondaryText: 'Star',
        visualCount: 3,
        options: [],
      },
      {
        activityId: 'off-act-2',
        atomCode: 'offline-elephant',
        activityType: 'MINI_CHALLENGE',
        titleVi: 'Thử Thách Kho Báu',
        titleEn: 'Treasure Quiz',
        promptVi: 'Loài vật nào có chiếc vòi dài thông minh?',
        promptEn: 'Which animal has a smart long trunk?',
        speechTextVi: 'Loài vật nào có chiếc vòi dài thông minh?',
        speechTextEn: 'Which animal has a smart long trunk?',
        emoji: '🐘',
        primaryText: 'Chú Voi',
        secondaryText: 'Elephant',
        options: [
          { label: 'Voi con', emoji: '🐘', value: 'elephant', isCorrect: true },
          { label: 'Cá vàng', emoji: '🐟', value: 'fish', isCorrect: false },
          { label: 'Bướm xinh', emoji: '🦋', value: 'butterfly', isCorrect: false },
        ],
      },
    ],
  };
}
