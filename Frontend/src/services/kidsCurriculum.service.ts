import api from './api';

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

export interface KidsLessonPlan {
  lessonId: string;
  islandId: string;
  ageBand: string;
  atomCount: number;
  activityCount: number;
  atoms: KidsConceptAtom[];
  activities: KidsActivity[];
}

export interface AiBuildKidsCurriculumRequest {
  topicTitle: string;
  islandId: string;
  ageBand: string;
  itemCount: number;
}

export interface AiBuildKidsCurriculumResponse {
  success: boolean;
  usedAi: boolean;
  islandId: string;
  atoms: KidsConceptAtom[];
  message: string;
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
    atomCount: number = 3
  ): Promise<KidsLessonPlan> {
    const res = await api.post<KidsLessonPlan>('/api/kids/daily-adventure', {
      islandId,
      ageBand,
      atomCount,
      weakAtomCodes: getWeakAtomCodes(),
    });
    return res.data;
  },

  async buildCurriculumWithAi(
    req: AiBuildKidsCurriculumRequest
  ): Promise<AiBuildKidsCurriculumResponse> {
    const res = await api.post<AiBuildKidsCurriculumResponse>('/api/kids/ai-build-curriculum', req);
    return res.data;
  },
};
