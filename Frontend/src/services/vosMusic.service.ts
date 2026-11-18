import api from '@/services/api';

export interface VosCompileRequestDto {
  inputText: string;
  mode: 'ARCHITECT' | 'MUSE';
  targetPlatform?: string;
  tuningHz: 432 | 440 | 528;
  language: 'vi' | 'en' | 'bilingual';
  customTitle?: string;
}

export interface VosAcousticTelemetryDto {
  totalSyllables: number;
  ngangRatio: number;
  huyenRatio: number;
  sacRatio: number;
  nangRatio: number;
  hoiRatio: number;
  ngaRatio: number;
  openVowelARatio: number;
  roundVowelUORatio: number;
  flatVowelIERatio: number;
  morphingDiphthongRatio: number;
  stopAttackRatio: number;
  fricativeAirRatio: number;
  nasalReverbRatio: number;
  hardGateRatio: number;
  pauseCommaCount: number;
  dropPeriodCount: number;
  burstExclamationCount: number;
  questionBendCount: number;
  dominantVibe: 'TINH_MICH' | 'CHOI_LOA' | 'MENG_MANG' | string;
  dominantVibeLabel: string;
}

export interface VosSunoMasterPackDto {
  songTitle: string;
  stylesPrompt: string;
  excludeStyles: string;
  weirdness: number;
  styleInfluence: number;
  lyricsBoxWithTags: string;
  markdownExport: string;
  csvRow: string;
}

export interface VosSynthRecipeDto {
  baseFreqHz: number;
  lowPassCutoffHz: number;
  reverbSeconds: number;
  subBassIntensity: number;
  brightness: number;
  tempoBpm: number;
  musicalKey: string;
  accentColor: string;
  visualArchetype: 'ZEN_MIST' | 'CYBER_SHARD' | 'FLUID_AURA' | string;
}

export interface VosKernelDocInfoDto {
  fileName: string;
  title: string;
  characterCount: number;
  summary: string;
}

export interface VosMusicCompilationResultDto {
  mode: string;
  tuningHz: number;
  usedAi: boolean;
  telemetry: VosAcousticTelemetryDto;
  sunoMasterPack: VosSunoMasterPackDto;
  lyriaPrompt: string;
  omniMultimodalPrompt: string;
  synthRecipe: VosSynthRecipeDto;
  groundedKernelSources: VosKernelDocInfoDto[];
}

export const vosMusicService = {
  async getKernelDocs(): Promise<VosKernelDocInfoDto[]> {
    const res = await api.get<VosKernelDocInfoDto[]>('/music-studio/kernel');
    return res.data;
  },

  async compile(req: VosCompileRequestDto): Promise<VosMusicCompilationResultDto> {
    const res = await api.post<VosMusicCompilationResultDto>('/music-studio/compile', req);
    return res.data;
  },
};
