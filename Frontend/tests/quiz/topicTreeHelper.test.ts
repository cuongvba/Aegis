import { describe, it, expect } from 'vitest';
import {
  buildHierarchicalTopicTree,
  getQuestionsForTopicSubtree,
  flattenTopicTreeForSelect,
  doesQuestionMatchTopicCode,
} from '@/shared/lib/quiz/topicTreeHelper';
import type { BankTopic } from '@/pages/admin/questions/types';

describe('topicTreeHelper — Hierarchical Topic Tree & Subtree Roll-up SSoT', () => {
  const sampleTopics: BankTopic[] = [
    {
      id: 'root-com',
      code: 'COMMUNITY',
      name: 'Cộng Đồng (Community)',
      categoryCode: 'COMMUNITY',
      enabled: true,
      visibilityScope: 'PUBLIC',
      materializedPath: '/COMMUNITY/',
      depthLevel: 0,
    },
    {
      id: 'child-com-tp1',
      code: 'COM_TP7C1DB611',
      name: 'Đề Tiếng Anh THPT 2026 (Cộng đồng)',
      categoryCode: 'COM_TP7C1DB611',
      parentId: 'root-com',
      enabled: true,
      visibilityScope: 'PUBLIC',
      materializedPath: '/COMMUNITY/COM_TP7C1DB611/',
      depthLevel: 1,
    },
    {
      id: 'root-studio',
      code: 'STUDIO',
      name: 'Creator Studio',
      categoryCode: 'STUDIO',
      enabled: true,
      visibilityScope: 'PUBLIC',
      materializedPath: '/STUDIO/',
      depthLevel: 1,
    },
    {
      id: 'date-20261105',
      code: 'STUDIO_20261105',
      name: 'Studio 2026-11-05',
      categoryCode: 'STUDIO',
      parentId: 'root-studio',
      enabled: true,
      visibilityScope: 'PUBLIC',
      materializedPath: '/STUDIO/20261105/',
      depthLevel: 2,
    },
    {
      id: 'crt-folder',
      code: 'STUDIO_20261105_CRTEC4DD2',
      name: 'Creator [CRTEC4DD2]',
      categoryCode: 'STUDIO',
      parentId: 'date-20261105',
      enabled: true,
      visibilityScope: 'PUBLIC',
      materializedPath: '/STUDIO/20261105/CRTEC4DD2/',
      depthLevel: 3,
    },
    {
      id: 'leaf-tp1',
      code: 'TP7C1DB611',
      name: 'Đề Tiếng Anh THPT 2026',
      categoryCode: 'TP7C1DB611',
      parentId: 'crt-folder',
      enabled: true,
      visibilityScope: 'PUBLIC',
      materializedPath: '/STUDIO/20261105/CRTEC4DD2/TP7C1DB611/',
      depthLevel: 4,
    },
    {
      id: 'leaf-tp2',
      code: 'TP4C914D34',
      name: 'Đề Toán THPT 2026',
      categoryCode: 'TP4C914D34',
      parentId: 'crt-folder',
      enabled: true,
      visibilityScope: 'PUBLIC',
      materializedPath: '/STUDIO/20261105/CRTEC4DD2/TP4C914D34/',
      depthLevel: 4,
    },
  ];

  const sampleQuestions = [
    { id: 'q1', content: 'Question 1', topicCode: 'TP7C1DB611', categoryCode: 'TP7C1DB611' },
    { id: 'q2', content: 'Question 2', topicCode: 'TP7C1DB611', categoryCode: 'TP7C1DB611' },
    { id: 'q3', content: 'Question 3', topicCode: 'TP4C914D34', categoryCode: 'TP4C914D34' },
  ];

  it('rolls up question counts from leaf nodes up to all ancestor folders', () => {
    const { roots, nodeByCode } = buildHierarchicalTopicTree(sampleTopics, sampleQuestions);

    expect(roots.length).toBe(2);
    expect(nodeByCode.get('TP7C1DB611')?.totalQuestionCount).toBe(2);
    expect(nodeByCode.get('TP4C914D34')?.totalQuestionCount).toBe(1);
    expect(nodeByCode.get('STUDIO_20261105_CRTEC4DD2')?.totalQuestionCount).toBe(3);
    expect(nodeByCode.get('STUDIO_20261105')?.totalQuestionCount).toBe(3);
    expect(nodeByCode.get('STUDIO')?.totalQuestionCount).toBe(3);

    // Community branch COM_TP7C1DB611 maps to TP7C1DB611 questions automatically
    expect(nodeByCode.get('COM_TP7C1DB611')?.totalQuestionCount).toBe(2);
    expect(nodeByCode.get('COMMUNITY')?.totalQuestionCount).toBe(2);
  });

  it('retrieves all descendant questions when selecting a parent folder node', () => {
    const studioQuestions = getQuestionsForTopicSubtree('STUDIO', sampleTopics, sampleQuestions);
    expect(studioQuestions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);

    const crtQuestions = getQuestionsForTopicSubtree(
      'STUDIO_20261105_CRTEC4DD2',
      sampleTopics,
      sampleQuestions
    );
    expect(crtQuestions.length).toBe(3);

    const communityQuestions = getQuestionsForTopicSubtree(
      'COMMUNITY',
      sampleTopics,
      sampleQuestions
    );
    expect(communityQuestions.map((q) => q.id)).toEqual(['q1', 'q2']);
  });

  it('formats hierarchical select options with tree connectors and roll-up counts', () => {
    const options = flattenTopicTreeForSelect(sampleTopics, sampleQuestions);
    expect(options.length).toBe(sampleTopics.length);
    expect(options[0].topic.code).toBe('STUDIO');
    expect(options.some((o) => o.label.includes('├─') || o.label.includes('└─'))).toBe(true);
  });

  it('matches questions via tags and COM_ prefix', () => {
    expect(
      doesQuestionMatchTopicCode(
        { topicCode: 'TP7C1DB611', tags: ['#COM_CUSTOM'] },
        'COM_CUSTOM'
      )
    ).toBe(true);
    expect(
      doesQuestionMatchTopicCode({ topicCode: 'TP7C1DB611' }, 'COM_TP7C1DB611')
    ).toBe(true);
  });
});

