export type ZenPracticeMode = 'study' | 'exam' | 'kids' | 'paper';

export interface ZenHomeworkConfig {
  mode: ZenPracticeMode;
  timeLimitMin: number; // 0 = Không giới hạn
  shuffleOptions: boolean;
  shuffleQuestions: boolean;
  enableQuestionTimer: boolean;
  questionTimeLimitSec: number;
  autoNextOnTimeout: boolean;
}

export const DEFAULT_ZEN_HOMEWORK_CONFIG: ZenHomeworkConfig = {
  mode: 'study',
  timeLimitMin: 45,
  shuffleOptions: false,
  shuffleQuestions: false,
  enableQuestionTimer: false,
  questionTimeLimitSec: 60,
  autoNextOnTimeout: false,
};

