export type PaperSectionType = 'PART_1_SINGLE' | 'PART_2_TRUE_FALSE' | 'PART_3_SHORT_ANSWER';

export interface PaperExamMetadata {
  schoolName: string;
  departmentName: string;
  examTitle: string;
  subjectName: string;
  gradeLevel: string;
  durationMinutes: number;
  examCode: string;
  academicYear: string;
}

export interface PaperQuestionOption {
  key: string; // 'A' | 'B' | 'C' | 'D' or 'a' | 'b' | 'c' | 'd'
  text: string;
  isCorrect: boolean;
}

export interface PaperQuestionItem {
  id: string;
  sectionType: PaperSectionType;
  order: number;
  content: string;
  options: PaperQuestionOption[];
  shortAnswerText?: string;
  explanation?: string;
  points: number;
  contextTitle?: string;
  contextContent?: string;
}

