import api from './api';

export interface KidsLocaleProfile {
  localeCode: string;
  langCode: string;
  nativeName: string;
  flagEmoji: string;
  direction: 'ltr' | 'rtl';
  speechTag: string;
  culturalScaleId: string;
  regionCode: string;
  isSystemDefault: boolean;
}

export interface KidsConceptAtom {
  atomCode: string;
  islandId: string;
  ageBand: string;
  order: number;
  emoji: string;
  primaryText: string;
  secondaryText: string;
  phonetic?: string;
  numericValue?: number;
  sampleSentenceEn: string;
  sampleSentenceVi: string;
  funFactEn: string;
  funFactVi: string;
  isAiGenerated: boolean;
  authorName?: string;
  authorClass?: string;
  creatorDream?: string;
  imageUrl?: string;
  voiceAudioUrl?: string;
  status?: string;
  gratitudeCount?: number;
  isCommunityContribution?: boolean;
}

export interface KidsChoiceOption {
  label: string;
  emoji: string;
  value: string;
  isCorrect: boolean;
}

export interface KidsActivity {
  activityId: string;
  atomCode: string;
  activityType: 'EXPOSE_CARD' | 'INTERACT_COUNT' | 'SPEAK_ECHO' | 'MINI_CHALLENGE';
  titleVi: string;
  titleEn: string;
  promptVi: string;
  promptEn: string;
  speechTextVi: string;
  speechTextEn: string;
  emoji: string;
  primaryText: string;
  secondaryText: string;
  phonetic?: string;
  visualCount?: number;
  targetSpeakText?: string;
  funFactVi?: string;
  funFactEn?: string;
  options: KidsChoiceOption[];
}

export interface KidsStageProp {
  emoji: string;
  labelVi: string;
  labelEn: string;
  colorHex: string;
}

export interface KidsStageTheme {
  stageCode: string;
  titleVi: string;
  titleEn: string;
  environment: string;
  particleMode: 'sky' | 'ocean' | 'fairy' | 'meadow';
  sfxType: 'pop' | 'splash' | 'unwrap' | 'bounce';
  backgroundGradient: string;
  badgeEmoji: string;
  isSystemDefault: boolean;
  preferredIslands: string[];
  props: KidsStageProp[];
  authorName?: string;
  authorClass?: string;
  creatorDream?: string;
  backdropImageUrl?: string;
  status?: string;
  gratitudeCount?: number;
}

export interface KidsLessonPlan {
  lessonId: string;
  islandId: string;
  ageBand: string;
  atomCount: number;
  activityCount: number;
  stageTheme?: KidsStageTheme;
  atoms: KidsConceptAtom[];
  activities: KidsActivity[];
}

export interface AiBuildKidsCurriculumRequest {
  topicTitle: string;
  islandId: string;
  ageBand: string;
  itemCount: number;
  regionCode?: string;
  languageCode?: string;
  skillCode?: string;
}

export interface AiBuildKidsCurriculumResponse {
  success: boolean;
  usedAi: boolean;
  islandId: string;
  skillCodeUsed?: string;
  atoms: KidsConceptAtom[];
  message: string;
}

export interface KidsAiSkill {
  skillCode: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  targetIslands: string[];
  isSystemDefault: boolean;
}

const FSRS_WEAK_KEY = 'aegis-kids-weak-atoms';

export function getWeakAtomCodes(): string[] {
  try {
    const raw = localStorage.getItem(FSRS_WEAK_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function recordAtomOutcome(atomCode: string, isSuccess: boolean): void {
  try {
    const current = new Set(getWeakAtomCodes());
    if (isSuccess) current.delete(atomCode);
    else current.add(atomCode);
    localStorage.setItem(FSRS_WEAK_KEY, JSON.stringify(Array.from(current).slice(0, 30)));
  } catch {
    // Ignore storage errors
  }
}

export const kidsCurriculumService = {
  async generateDailyAdventure(
    islandId: string,
    ageBand: string = 'all',
    atomCount: number = 3,
    preferredStageCode?: string,
    regionCode?: string
  ): Promise<KidsLessonPlan> {
    const res = await api.post<KidsLessonPlan>('/api/kids/daily-adventure', {
      islandId,
      ageBand,
      atomCount,
      preferredStageCode: preferredStageCode || undefined,
      regionCode: regionCode || undefined,
      weakAtomCodes: getWeakAtomCodes(),
    });
    return res.data;
  },

  async getStageThemes(includePending = false): Promise<KidsStageTheme[]> {
    const res = await api.get<KidsStageTheme[]>('/api/kids/stages', { params: { includePending } });
    return res.data;
  },

  async getConceptAtoms(includePending = false): Promise<KidsConceptAtom[]> {
    const res = await api.get<KidsConceptAtom[]>('/api/kids/atoms', { params: { includePending } });
    return res.data;
  },

  async saveStageTheme(stage: KidsStageTheme): Promise<KidsStageTheme> {
    const res = await api.post<KidsStageTheme>('/api/kids/stages', stage);
    return res.data;
  },

  async submitCreatorBundle(bundle: {
    authorName: string;
    authorClass?: string;
    creatorDream?: string;
    customStage?: KidsStageTheme;
    atoms: Partial<KidsConceptAtom>[];
  }) {
    const res = await api.post('/api/kids/creator/submit-bundle', bundle);
    return res.data;
  },

  async moderateContribution(code: string, approve: boolean) {
    const res = await api.post(`/api/kids/contributions/${encodeURIComponent(code)}/moderate`, null, {
      params: { approve },
    });
    return res.data;
  },

  async giveGratitude(code: string): Promise<number> {
    const res = await api.post<{ gratitudeCount: number }>(`/api/kids/contributions/${encodeURIComponent(code)}/gratitude`);
    return res.data?.gratitudeCount ?? 0;
  },

  async buildCurriculumWithAi(
    req: AiBuildKidsCurriculumRequest
  ): Promise<AiBuildKidsCurriculumResponse> {
    const res = await api.post<AiBuildKidsCurriculumResponse>('/api/kids/ai-build-curriculum', req);
    return res.data;
  },

  async aiSynthesizeBundle(
    topicTitle: string,
    islandId: string,
    ageBand: string,
    itemCount = 3,
    regionCode?: string,
    languageCode?: string
  ) {
    const res = await api.post<{
      creatorDream?: string;
      customStage?: KidsStageTheme;
      atoms: Partial<KidsConceptAtom>[];
    }>('/api/kids/ai-synthesize-bundle', { topicTitle, islandId, ageBand, itemCount, regionCode, languageCode });
    return res.data;
  },

  async getAiSkills(islandId?: string): Promise<KidsAiSkill[]> {
    const res = await api.get<KidsAiSkill[]>('/api/kids/ai-skills', {
      params: islandId ? { islandId } : undefined,
    });
    return res.data;
  },

  async getLocaleProfiles(): Promise<KidsLocaleProfile[]> {
    const res = await api.get<KidsLocaleProfile[]>('/api/kids/locales');
    return res.data;
  },

  async saveLocaleProfile(profile: KidsLocaleProfile): Promise<KidsLocaleProfile> {
    const res = await api.post<KidsLocaleProfile>('/api/kids/locales', profile);
    return res.data;
  },
};
