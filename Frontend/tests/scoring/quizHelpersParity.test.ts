import { describe, it, expect } from 'vitest';
import {
  evaluateQuestion,
  scoreQuestion,
  isOptionCorrect,
  calculateQuizResult,
} from '@/lib/quiz-helpers';
import type { LearnerQuestion } from '@/types/quiz';

function createQuestion(overrides: Partial<LearnerQuestion>): LearnerQuestion {
  return {
    id: 'q-1',
    questNo: 1,
    topicCode: 'MATH_12',
    topicName: 'Toán 12',
    questionType: 'SINGLE',
    content: 'Câu hỏi kiểm thử',
    options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
    answerRaw: 'B',
    points: 1,
    difficulty: 2,
    enabled: true,
    ...overrides,
  };
}

describe('quiz-helpers — 1:1 Server IQuestionEvaluatorStrategy Contract Parity Suite', () => {
  it('SINGLE & TRUE_FALSE: matches answer by 1-based index, letter label (A-D), or exact option text', () => {
    const q = createQuestion({ questionType: 'SINGLE', answerRaw: 'C', points: 0.25 });
    expect(scoreQuestion(q, { selectedOption: '3' })).toBe(0.25);
    expect(scoreQuestion(q, { selectedOption: '1' })).toBe(0);

    const opts = [
      { id: '1', label: 'A', value: 'Phương án A', isMedia: false, mediaType: 'text' },
      { id: '3', label: 'C', value: 'Phương án C', isMedia: false, mediaType: 'text' },
    ];
    expect(isOptionCorrect(q, opts[0])).toBe(false);
    expect(isOptionCorrect(q, opts[1])).toBe(true);
  });

  it('MULTI: awards full points only when selected set matches expected set exactly', () => {
    const q = createQuestion({ questionType: 'MULTI', answerRaw: 'A, C', points: 1.0 });
    expect(scoreQuestion(q, { selectedOptions: ['1', '3'] })).toBe(1.0);
    expect(scoreQuestion(q, { selectedOptions: ['3', '1'] })).toBe(1.0);
    expect(scoreQuestion(q, { selectedOptions: ['1'] })).toBe(0);
    expect(scoreQuestion(q, { selectedOptions: ['1', '2', '3'] })).toBe(0);
  });

  it('MULTI_TRUE_FALSE: strictly follows MOET GDPT 2025 stepped scoring (0.1 / 0.25 / 0.5 / 1.0)', () => {
    const q = createQuestion({
      questionType: 'MULTI_TRUE_FALSE',
      answerRaw: 'a:Đ, b:S, c:Đ, d:S',
      points: 1.0,
    });

    // 0/4 correct -> 0 points
    expect(scoreQuestion(q, { matrixAnswer: { a: false, b: true, c: false, d: true } })).toBe(0);
    // 1/4 correct -> 0.1 points
    expect(scoreQuestion(q, { matrixAnswer: { a: true, b: true, c: false, d: true } })).toBe(0.1);
    // 2/4 correct -> 0.25 points
    expect(scoreQuestion(q, { matrixAnswer: { a: true, b: false, c: false, d: true } })).toBe(0.25);
    // 3/4 correct -> 0.5 points
    expect(scoreQuestion(q, { matrixAnswer: { a: true, b: false, c: true, d: true } })).toBe(0.5);
    // 4/4 correct -> 1.0 point
    expect(scoreQuestion(q, { matrixAnswer: { a: true, b: false, c: true, d: false } })).toBe(1.0);
  });

  it('SHORT_ANSWER: normalizes whitespace and case for numeric and text responses', () => {
    const q = createQuestion({
      questionType: 'SHORT_ANSWER',
      options: [],
      answerRaw: '12,5',
      points: 0.5,
    });

    expect(scoreQuestion(q, { shortText: '  12,5 ' })).toBe(0.5);
    expect(scoreQuestion(q, { shortText: '12.5' })).toBe(0);
  });

  it('ORDERING: evaluates both untouched default order and user-reordered sequence', () => {
    const q = createQuestion({
      questionType: 'ORDERING',
      options: ['Bước 1', 'Bước 2', 'Bước 3'],
      answerRaw: '1,2,3',
      points: 1.0,
    });

    // Untouched default order matches 1,2,3
    expect(scoreQuestion(q, undefined)).toBe(1.0);
    expect(scoreQuestion(q, { ordering: ['2', '1', '3'] })).toBe(0);
    expect(scoreQuestion(q, { ordering: ['1', '2', '3'] })).toBe(1.0);
  });

  it('MATCHING: evaluates canonical left:right pairs accurately', () => {
    const q = createQuestion({
      questionType: 'MATCHING',
      options: ['Đạo hàm x^2 => 2x', 'Đạo hàm sin(x) => cos(x)'],
      answerRaw: '1:1, 2:2',
      points: 1.0,
    });

    expect(
      scoreQuestion(q, {
        matching: {
          'Đạo hàm x^2': '2x',
          'Đạo hàm sin(x)': 'cos(x)',
        },
      })
    ).toBe(1.0);

    expect(
      scoreQuestion(q, {
        matching: {
          'Đạo hàm x^2': 'cos(x)',
          'Đạo hàm sin(x)': '2x',
        },
      })
    ).toBe(0);
  });

  it('ESSAY: marks status as manual and excludes from automated total points', () => {
    const qEssay = createQuestion({ id: 'q-essay', questionType: 'ESSAY', points: 2.0 });
    const evalRes = evaluateQuestion(qEssay, { essay: 'Bài giải tự luận chi tiết' });

    expect(evalRes.status).toBe('manual');
    expect(evalRes.score).toBe(0);
    expect(evalRes.answered).toBe(true);

    const qMcq = createQuestion({ id: 'q-mcq', questionType: 'SINGLE', answerRaw: 'A', points: 1.0 });
    const summary = calculateQuizResult([qMcq, qEssay], {
      'q-mcq': { selectedOption: '1' },
      'q-essay': { essay: 'Bài làm' },
    });

    expect(summary.earnedPoints).toBe(1.0);
    expect(summary.totalPoints).toBe(1.0);
    expect(summary.scoredQuestions).toBe(1);
    expect(summary.totalQuestions).toBe(2);
    expect(summary.answeredQuestions).toBe(2);
  });
});
