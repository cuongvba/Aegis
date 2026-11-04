import { ZenHomeworkConfig } from './zen-homework.types';

export interface TaxonomyAlignment {
  domainCode: string;
  domainName: string;
  targetLevel: string;
  categoryCode: string;
  categoryName: string;
  benchmarkStandard: string;
  cognitiveLevel: string;
  confidenceScore: number;
}

export interface ZenQuestionPreview {
  order: number;
  content: string;
  canonicalHash: string;
  isDuplicate: boolean;
  questionType?: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  /** true khi Creator đã chỉnh sửa trực tiếp trên Studio */
  edited?: boolean;

  // [Universal Shared Context / Stimulus] Dữ liệu dùng chung (Đoạn văn đọc hiểu, tình huống, bài nghe)
  contextId?: string;
  contextTitle?: string;
  contextContent?: string;

  // [Hierarchy & Provenance] Tọa độ phân cấp & số hiệu câu gốc
  sourceQuestionNo?: string;
  hierarchyIndex?: string;
  fullQuestionIndex?: string;
  subItems?: any[];
}

export type ZenQuestionPatch = Partial<Pick<ZenQuestionPreview, 'content' | 'options' | 'correctAnswer' | 'explanation' | 'contextTitle' | 'contextContent'>>;

export interface ZenUploadResult {
  success: boolean;
  examTitle: string;
  totalQuestions: number;
  duplicateCount: number;
  uniqueCount: number;
  deduplicationRatePercentage: number;
  suggestedTaxonomy?: TaxonomyAlignment;
  questions: ZenQuestionPreview[];
}

export interface EducatorPartnershipInfo {
  id: string;
  userId: string;
  referralCode: string;
  trialExpiresAt: string;
  daysRemaining: number;
  isActive: boolean;
  revenueShareRate: number;
  karmaPoints: number;
  payoutBankAccount?: string;
  campaignCode?: string;
  campaignName?: string;
  trialDays?: number;
  coffeeProDays?: number;
  coffeePriceVnd?: number;
  coffeeBankBin?: string;
  coffeeAccountNumber?: string;
  coffeeAccountName?: string;
}

export interface ZenRoomLaunchResult {
  pinCode: string;
  roomId: string;
  gameCode?: string;
  title: string;
  joinUrl: string;
  directArenaUrl?: string;
  questionCount?: number;
  qrCodeData: string;
  launchedAt: string;
}

export interface ZenBankSaveResult {
  success: boolean;
  topicId: string;
  topicCode: string;
  questionCount: number;
  practiceUrl: string;
  message: string;
  homeworkConfig?: ZenHomeworkConfig;
}
